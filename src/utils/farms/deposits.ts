import {
  DepositNftType,
  useAccountDepositIds,
  useAllDeposits,
  useDeposits,
} from "api/deposits"
import { usePools, usePoolShareToken, usePoolShareTokens } from "api/pools"
import { useUsdSpotPrices } from "api/spotPrice"
import { useTotalIssuance, useTotalIssuances } from "api/totalIssuance"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { getPoolTotal } from "sections/pools/header/PoolsHeader.utils"
import { useAccountStore } from "state/store"
import { useQueryReduce } from "utils/helpers"
import { BN_0, BN_10 } from "../constants"

export const useUserDeposits = (poolId: string) => {
  const { account } = useAccountStore()
  const deposits = useDeposits(poolId)
  const depositIds = useAccountDepositIds(account?.address)

  return useQueryReduce(
    [deposits, depositIds] as const,
    (deposits, depositIds) => {
      return deposits.filter((deposit) =>
        depositIds?.some((id) => id.instanceId.eq(deposit.id)),
      )
    },
  )
}

export const useAllUserDeposits = () => {
  const { account } = useAccountStore()
  const pools = usePools()
  const allDeposits = useAllDeposits(pools.data?.map((p) => p.address) ?? [])
  const depositIds = useAccountDepositIds(account?.address)

  const queries = [pools, ...allDeposits, depositIds]
  const isLoading = queries.some((q) => q.isLoading)
  const isInitialLoading = queries.some((q) => q.isInitialLoading)

  const deposits = useMemo(() => {
    if (allDeposits.some((q) => !q.data) || !depositIds.data) return undefined

    return (
      allDeposits.reduce(
        (acc, curr) => [
          ...acc,
          ...(curr.data?.filter((deposit) =>
            depositIds.data?.some(
              (id) => id.instanceId.toString() === deposit?.id.toString(),
            ),
          ) ?? []),
        ],
        [] as DepositNftType[],
      ) ?? []
    )
  }, [allDeposits, depositIds.data])

  const positions = useMemo(
    () =>
      deposits
        ?.map(({ deposit }) =>
          deposit.yieldFarmEntries.map((position) => ({
            position,
            poolId: deposit.ammPoolId,
          })),
        )
        .flat(2),
    [deposits],
  )

  return {
    data: { deposits, positions },
    isLoading,
    isInitialLoading,
  }
}

export const useDepositValues = (depositNft: DepositNftType) => {
  const pools = usePools()
  const pool = pools.data?.find(
    (p) => p.address === depositNft.deposit.ammPoolId.toString(),
  )

  const shareToken = usePoolShareToken(pool?.address ?? "")
  const totalIssuances = useTotalIssuances([
    shareToken.data?.token.toString(),
    ...(pool?.tokens.map((t) => t.id) ?? []),
  ])

  const spotPrices = useUsdSpotPrices(
    pool?.tokens.map((token) => token.id) ?? [],
  )

  const queries = [pools, shareToken, ...totalIssuances, ...spotPrices]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    const defaultValue = {
      assetA: undefined,
      assetB: undefined,
      amountUSD: undefined,
    }

    if (
      !pool ||
      !shareToken.data ||
      spotPrices.some((q) => !q.data) ||
      totalIssuances.some((q) => !q.data)
    )
      return defaultValue

    const shareTokenIssuance = totalIssuances.find(
      (ti) => ti.data?.token.toString() === shareToken.data.token.toString(),
    )?.data?.total

    if (!shareTokenIssuance) {
      console.error("Could not calculate deposit balances")
      return defaultValue
    }

    const shares = depositNft.deposit.shares.toBigNumber()
    const ratio = shares.div(shareTokenIssuance)

    const poolTotal = getPoolTotal(
      pool.tokens,
      spotPrices.map((sp) => sp.data),
    )

    const amountUSD = poolTotal.times(ratio)
    const [assetA, assetB] = pool?.tokens.map((token) => {
      const balance = new BigNumber(token.balance)
      const amount = balance.times(ratio).div(BN_10.pow(token.decimals))
      return { id: token.id, symbol: token.symbol, amount }
    })

    return { assetA, assetB, amountUSD }
  }, [
    pool,
    shareToken.data,
    spotPrices,
    totalIssuances,
    depositNft.deposit.shares,
  ])

  return { ...data, isLoading }
}

export const useTotalInDeposit = (depositNft: DepositNftType) => {
  const pools = usePools()
  const pool = pools.data?.find(
    (p) => p.address === depositNft.deposit.ammPoolId.toString(),
  )

  const shareToken = usePoolShareToken(pool?.address ?? "")
  const totalIssuance = useTotalIssuance(shareToken.data?.token)

  const spotPrices = useUsdSpotPrices(
    pool?.tokens.map((token) => token.id) ?? [],
  )

  const queries = [pools, shareToken, totalIssuance, ...spotPrices]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !pool ||
      !totalIssuance.data ||
      spotPrices.some((q) => !q.data) ||
      isLoading
    )
      return undefined

    const poolTotal = getPoolTotal(
      pool.tokens,
      spotPrices.map((sp) => sp.data),
    )

    const shares = depositNft.deposit.shares.toBigNumber()
    const ratio = shares.div(totalIssuance.data.total)
    const total = poolTotal.times(ratio)

    return total
  }, [
    pool,
    totalIssuance.data,
    spotPrices,
    isLoading,
    depositNft.deposit.shares,
  ])

  return { data, isLoading }
}

export const useTotalInDeposits = (depositNfts: DepositNftType[]) => {
  const poolsData = usePools()
  const pools = poolsData.data?.filter((p) =>
    depositNfts.some((d) => d.deposit.ammPoolId.toString() === p.address),
  )

  const shareTokens = usePoolShareTokens(pools?.map((p) => p.address) ?? [])
  const totalIssuances = useTotalIssuances(
    shareTokens.map((st) => st.data?.token) ?? [],
  )

  const spotPrices = useUsdSpotPrices(
    pools?.map((pool) => pool.tokens.map((t) => t.id)).flat() ?? [],
  )

  const queries = [poolsData, ...shareTokens, ...totalIssuances, ...spotPrices]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      pools === undefined ||
      shareTokens.some((q) => !q.data) ||
      totalIssuances.some((q) => !q.data) ||
      spotPrices.some((q) => !q.data) ||
      isLoading
    )
      return undefined

    const totals = depositNfts.map((depositNft) => {
      const poolId = depositNft.deposit.ammPoolId.toString()
      const pool = pools?.find((p) => p.address === poolId)
      const shareToken = shareTokens.find(
        (st) => st.data?.poolId.toString() === poolId,
      )
      const totalIssuance = totalIssuances.find(
        (ti) =>
          ti.data?.token.toString() === shareToken?.data?.token.toString(),
      )

      if (!pool || !totalIssuance?.data) {
        console.error("Unable to calculate deposit total")
        return BN_0
      }

      const poolTotal = getPoolTotal(
        pool.tokens,
        spotPrices.map((sp) => sp.data),
      )
      const shares = depositNft.deposit.shares.toBigNumber()
      const ratio = shares.div(totalIssuance.data.total)
      const total = poolTotal.times(ratio)

      return total
    })

    return totals.reduce((acc, curr) => acc.plus(curr), BN_0)
  }, [depositNfts, pools, shareTokens, totalIssuances, spotPrices, isLoading])

  return { data, isLoading }
}

export const useTotalInUsersDeposits = () => {
  const deposits = useAllUserDeposits()
  const total = useTotalInDeposits(deposits.data.deposits ?? [])

  return { data: total.data, isLoading: deposits.isLoading || total.isLoading }
}

export const useTotalInAllDeposits = () => {
  const pools = usePools()
  const allDeposits = useAllDeposits(pools.data?.map((pool) => pool.address))
  const deposits = allDeposits.reduce(
    (acc, deposit) => (deposit.data ? [...acc, ...deposit.data] : acc),
    [] as DepositNftType[],
  )
  const total = useTotalInDeposits(deposits)

  const queries = [pools, total, ...allDeposits]
  const isLoading = queries.some((q) => q.isLoading)

  return { data: total.data, isLoading }
}
