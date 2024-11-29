import { PoolBase } from "@galacticcouncil/sdk"
import { u32 } from "@polkadot/types"
import { AccountId32 } from "@polkadot/types/interfaces"
import { u8aToHex } from "@polkadot/util"
import { decodeAddress } from "@polkadot/util-crypto"
import { useMutation } from "@tanstack/react-query"
import { useTokenAccountBalancesList } from "api/accountBalances"
import { useAssetDetailsList } from "api/assetDetails"
import { useBestNumber } from "api/chain"
import { DepositNftType } from "api/deposits"
import { useFarms, useInactiveFarms } from "api/farms"
import { usePools } from "api/pools"
import { useUsdSpotPrices } from "api/spotPrice"
import BigNumber from "bignumber.js"
import { ToastMessage, useStore } from "state/store"
import { useApiPromise } from "utils/api"
import { BN_0 } from "utils/constants"
import { getAccountResolver } from "utils/farms/claiming/accountResolver"
import { XYKLiquidityMiningClaimSim } from "utils/farms/claiming/claimSimulator"
import { MultiCurrencyContainer } from "utils/farms/claiming/multiCurrency"
import { createMutableFarmEntries } from "utils/farms/claiming/mutableFarms"
import { useAllUserDeposits } from "utils/farms/deposits"

export const useClaimableAmount = (
  pool?: PoolBase,
  depositNft?: DepositNftType,
) => {
  const bestNumberQuery = useBestNumber()

  const pools = usePools()
  const userDeposits = useAllUserDeposits()
  const filteredDeposits = pool
    ? {
        ...userDeposits,
        data: {
          deposits:
            userDeposits.data.deposits?.filter(
              (deposit) =>
                deposit.deposit.ammPoolId.toString() === pool?.address,
            ) ?? [],
        },
      }
    : userDeposits

  const farms = useFarms(
    pool?.address ? [pool.address] : pools.data?.map((p) => p.address) ?? [],
  )

  const inactiveFarms = useInactiveFarms(
    pool?.address ? [pool.address] : pools.data?.map((p) => p.address) ?? [],
  )

  const allFarms = [...(farms.data ?? []), ...(inactiveFarms.data ?? [])]

  const { api } = useApiPromise()
  const accountResolver = getAccountResolver(api.registry)

  const assetIds = [
    ...new Set(allFarms?.map((i) => i.globalFarm.rewardCurrency.toString())),
  ]

  const assetList = useAssetDetailsList(assetIds)

  const usdSpotPrices = useUsdSpotPrices(assetIds)

  const accountAddresses =
    allFarms
      ?.map(
        ({ globalFarm }) =>
          [
            [accountResolver(0), globalFarm.rewardCurrency],
            [accountResolver(globalFarm.id), globalFarm.rewardCurrency],
          ] as [AccountId32, u32][],
      )
      .flat(1) ?? []

  const accountBalances = useTokenAccountBalancesList(accountAddresses)

  const queries = [
    bestNumberQuery,
    filteredDeposits,
    farms,
    assetList,
    accountBalances,
  ]
  const isLoading = queries.some((q) => q.isLoading)

  if (bestNumberQuery.data == null || accountBalances.data == null)
    return { data: null, isLoading }

  const deposits =
    depositNft != null ? [depositNft] : filteredDeposits.data?.deposits ?? []
  const bestNumber = bestNumberQuery.data

  const multiCurrency = new MultiCurrencyContainer(
    accountAddresses,
    accountBalances.data,
  )
  const sim = new XYKLiquidityMiningClaimSim(
    getAccountResolver(api.registry),
    multiCurrency,
    assetList.data ?? [],
  )

  const { globalFarms, yieldFarms } = createMutableFarmEntries(allFarms ?? [])

  const rewardSum = deposits
    ?.map((record) =>
      record.deposit.yieldFarmEntries.map((farmEntry) => {
        const aprEntry = allFarms?.find(
          (i) =>
            i.globalFarm.id.eq(farmEntry.globalFarmId) &&
            i.yieldFarm.id.eq(farmEntry.yieldFarmId),
        )
        if (!aprEntry) return null

        const reward = sim.claim_rewards(
          globalFarms[aprEntry.globalFarm.id.toString()],
          yieldFarms[aprEntry.yieldFarm.id.toString()],
          farmEntry,
          bestNumber.relaychainBlockNumber.toBigNumber(),
        )

        const usd = usdSpotPrices.find(
          (spot) => spot.data?.tokenIn === reward?.assetId,
        )?.data

        if (!reward || !usd) return null

        return {
          usd: reward.value.multipliedBy(usd.spotPrice),
          asset: { id: reward?.assetId, value: reward.value },
        }
      }),
    )
    .flat(2)
    .reduce<{
      usd: BigNumber
      assets: Record<string, BigNumber>
    }>(
      (memo, item) => {
        if (item == null) return memo

        const { id, value } = item.asset

        memo.usd = memo.usd.plus(item.usd)

        !memo.assets[id]
          ? (memo.assets[id] = value)
          : (memo.assets[id] = memo.assets[id].plus(value))

        return memo
      },
      { usd: BN_0, assets: {} },
    )

  return { data: rewardSum, isLoading }
}

export const useClaimAllMutation = (
  poolId?: string,
  depositNft?: DepositNftType,
  toast?: ToastMessage,
  onClose?: () => void,
) => {
  const { api } = useApiPromise()
  const { createTransaction } = useStore()
  const userDeposits = useAllUserDeposits()

  const deposits = depositNft
    ? [depositNft]
    : poolId
    ? userDeposits.data.deposits?.filter(
        (d) => d.deposit.ammPoolId.toString() === poolId,
      )
    : userDeposits.data.deposits

  const claim = useMutation(async () => {
    const txs =
      deposits
        ?.map((i) =>
          i.deposit.yieldFarmEntries.map((entry) => {
            return api.tx.xykLiquidityMining.claimRewards(
              i.id,
              entry.yieldFarmId,
            )
          }),
        )
        .flat(2) ?? []

    if (txs.length > 1) {
      return await createTransaction(
        { tx: api.tx.utility.forceBatch(txs) },
        { toast, onClose, onBack: onClose ? () => {} : undefined },
      )
    } else if (txs.length > 0) {
      return await createTransaction(
        { tx: txs[0] },
        { toast, onClose, onBack: onClose ? () => {} : undefined },
      )
    }
  })

  return { mutation: claim, isLoading: userDeposits.isLoading }
}

// @ts-expect-error
window.decodeAddressToBytes = (bsx: string) => u8aToHex(decodeAddress(bsx))
