import * as liquidityMining from "@galacticcouncil/math-liquidity-mining"
import { AccountId32 } from "@polkadot/types/interfaces/runtime"
import { PalletLiquidityMiningLoyaltyCurve } from "@polkadot/types/lookup"
import { useAccountsBalances } from "api/accountBalances"
import { useBestNumber } from "api/chain"
import { useFarms } from "api/farms"
import BigNumber from "bignumber.js"
import { secondsInYear } from "date-fns"
import { NATIVE_ASSET_ID } from "utils/api"
import { BLOCK_TIME, BN_0, BN_1, BN_QUINTILL } from "utils/constants"
import { isNotNil, useQueryReduce } from "utils/helpers"

export type AprFarm = NonNullable<
  Exclude<ReturnType<typeof useAPR>["data"], undefined>[number]
>

export const useAPR = (poolId: AccountId32 | string) => {
  const bestNumber = useBestNumber()
  const poolFarms = useFarms([poolId])

  const potAddresses =
    poolFarms.data?.map((farm) => farm.globalFarmPotAddress).filter(isNotNil) ??
    []

  const balances = useAccountsBalances(potAddresses)

  return useQueryReduce(
    [bestNumber, poolFarms] as const,
    (bestNumber, poolFarms) => {
      const data = poolFarms.map((farm) => {
        const { globalFarm, yieldFarm, globalFarmPotAddress } = farm

        const loyaltyFactor = yieldFarm.loyaltyCurve.isNone
          ? BN_1
          : yieldFarm.loyaltyCurve
              .unwrap()
              .initialRewardPercentage.toBigNumber()
              .div(BN_QUINTILL)

        const loyaltyCurve = yieldFarm.loyaltyCurve.unwrapOr(null)
        const totalSharesZ = globalFarm.totalSharesZ.toBigNumber()
        const plannedYieldingPeriods =
          globalFarm.plannedYieldingPeriods.toBigNumber()
        const yieldPerPeriod = globalFarm.yieldPerPeriod
          .toBigNumber()
          .div(BN_QUINTILL) // 18dp
        const maxRewardPerPeriod = globalFarm.maxRewardPerPeriod.toBigNumber()
        const blocksPerPeriod = globalFarm.blocksPerPeriod.toBigNumber()
        const currentPeriod = bestNumber.relaychainBlockNumber
          .toBigNumber()
          .dividedToIntegerBy(blocksPerPeriod)
        const blockTime = BLOCK_TIME
        const multiplier = yieldFarm.multiplier.toBigNumber().div(BN_QUINTILL)
        const secondsPerYear = new BigNumber(secondsInYear)
        const periodsPerYear = secondsPerYear.div(
          blockTime.times(blocksPerPeriod),
        )

        let apr
        if (totalSharesZ.isZero()) {
          apr = yieldPerPeriod.times(multiplier).times(periodsPerYear)
        } else {
          const globalRewardPerPeriod = getGlobalRewardPerPeriod(
            totalSharesZ,
            yieldPerPeriod,
            maxRewardPerPeriod,
          )
          const poolYieldPerPeriod = getPoolYieldPerPeriod(
            globalRewardPerPeriod,
            multiplier,
            totalSharesZ,
          )
          apr = poolYieldPerPeriod.times(periodsPerYear)
        }

        // multiply by 100 since APR should be a percentage
        apr = apr.times(100)

        // all of the APR calculations are using only half of the position -
        // this is correct in terms of inputs but for the user,
        // they are not depositing only half of the position, they are depositing 2 assets
        apr = globalFarm.id.toString() === "5" ? BN_0 : apr.div(2)
        const minApr = apr.times(loyaltyFactor)

        // max distribution of rewards
        // https://www.notion.so/Screen-elements-mapping-Farms-baee6acc456542ca8d2cccd1cc1548ae?p=4a2f16a9f2454095945dbd9ce0eb1b6b&pm=s
        const distributedRewards = globalFarm.pendingRewards
          .toBigNumber()
          .plus(globalFarm.accumulatedPaidRewards.toBigNumber())

        const maxRewards = maxRewardPerPeriod.times(plannedYieldingPeriods)
        const leftToDistribute = maxRewards.minus(distributedRewards)

        // estimate, when the farm will most likely distribute all the rewards
        const updatedAtPeriod = globalFarm.updatedAt.toBigNumber()
        const periodsLeft = leftToDistribute.div(maxRewardPerPeriod)

        // if there are no deposits, the farm is not running and distributing rewards
        const estimatedEndPeriod = totalSharesZ.gte(0)
          ? updatedAtPeriod.plus(periodsLeft)
          : currentPeriod.plus(periodsLeft)

        const estimatedEndBlock = estimatedEndPeriod.times(blocksPerPeriod)

        // fullness of the farm
        // interpreted as how close are we to the cap of yield per period
        // https://www.notion.so/FAQ-59697ce6fd2e46e1b8f9093ba4606e88#446ee616be484c5e86e5eb82d3a29455
        const fullness = totalSharesZ
          .times(yieldPerPeriod)
          .div(maxRewardPerPeriod)

        const rewardCurrency = globalFarm.rewardCurrency.toString()
        const accountBalance = balances.find(
          (balance) => balance.data?.address === globalFarmPotAddress,
        )

        const maxReward = accountBalance
          ? rewardCurrency === NATIVE_ASSET_ID
            ? accountBalance.data?.native.data.free.toBigNumber()
            : accountBalance.data?.balances
                .find((balance) => balance.id.toString() === rewardCurrency)
                ?.data.free.toBigNumber()
          : undefined

        const potMaxBalance = maxReward
          ? distributedRewards.plus(maxReward)
          : undefined

        return {
          minApr,
          apr,
          distributedRewards,
          maxRewards,
          potMaxBalance,
          fullness,
          estimatedEndBlock: estimatedEndBlock,
          assetId: rewardCurrency,
          currentPeriod,
          loyaltyCurve,
          ...farm,
        }
      })

      return data.filter((x): x is NonNullable<(typeof data)[number]> => !!x)
    },
  )
}

export const getGlobalRewardPerPeriod = (
  totalSharesZ: BigNumber,
  yieldPerPeriod: BigNumber,
  maxRewardPerPeriod: BigNumber,
) => {
  const globalRewardPerPeriod = totalSharesZ.times(yieldPerPeriod)
  const isFarmFull = globalRewardPerPeriod.gte(maxRewardPerPeriod)

  return isFarmFull ? maxRewardPerPeriod : globalRewardPerPeriod
}

export const getPoolYieldPerPeriod = (
  globalRewardPerPeriod: BigNumber,
  multiplier: BigNumber,
  totalSharesZ: BigNumber,
) => {
  return globalRewardPerPeriod.times(multiplier).div(totalSharesZ)
}

export const getMinAndMaxAPR = (aprFarms: AprFarm[]) => {
  const aprs = aprFarms.map(({ apr }) => apr)
  const minAprs = aprFarms.map(({ minApr }) => minApr)

  const minApr = BigNumber.minimum(...minAprs)
  const maxApr = BigNumber.maximum(...aprs)
  return {
    minApr,
    maxApr,
  }
}

export const getCurrentLoyaltyFactor = (
  loyaltyCurve: PalletLiquidityMiningLoyaltyCurve | null,
  currentPeriod: BigNumber,
) => {
  if (!loyaltyCurve) return 1
  return BigNumber(
    liquidityMining.calculate_loyalty_multiplier(
      currentPeriod.toFixed(),
      loyaltyCurve.initialRewardPercentage.toBigNumber().toFixed(),
      loyaltyCurve.scaleCoef.toBigNumber().toFixed(),
    ),
  )
    .div(BN_QUINTILL)
    .toNumber()
}
