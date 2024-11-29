import { PoolToken } from "@galacticcouncil/sdk"
import { useTokensBalances } from "api/balances"
import { DepositNftType, useAllDeposits } from "api/deposits"
import { usePoolShareTokens, usePools } from "api/pools"
import { SpotPrice } from "api/spotPrice"
import { useTotalIssuances } from "api/totalIssuance"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { useAccountStore } from "state/store"
import { getFloatingPointAmount } from "utils/balance"
import { BN_0 } from "utils/constants"
import {
  useTotalInDeposits,
  useTotalInUsersDeposits,
} from "utils/farms/deposits"
import { isNotNil } from "utils/helpers"
import { useTotalInPools } from "../pool/Pool.utils"

export const getPoolTotal = (
  tokens: PoolToken[],
  spotPrices: (SpotPrice | undefined)[],
) => {
  const total = tokens.reduce((acc, token) => {
    const amount = getFloatingPointAmount(
      new BigNumber(token.balance),
      token.decimals,
    )

    const spotPrice = spotPrices.find((sp) => sp?.tokenIn === token.id)

    const total = amount.times(spotPrice?.spotPrice ?? BN_0)

    return acc.plus(total)
  }, BN_0)

  return total
}

export const useTotalLocked = () => {
  const pools = usePools()
  const poolIds = pools.data?.map((pool) => pool.address) ?? []
  const poolsTotal = useTotalInPools(pools.data ?? [])
  const deposits = useAllDeposits(poolIds)
  const depositsTotal = useTotalInDeposits(
    deposits.reduce(
      (acc, curr) => [...acc, ...(curr.data ?? [])],
      [] as DepositNftType[],
    ),
  )

  const queries = [pools, poolsTotal, ...deposits, depositsTotal]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (!poolsTotal.data || !depositsTotal.data) return BN_0
    return poolsTotal.data.total.plus(depositsTotal.data)
  }, [poolsTotal.data, depositsTotal.data])

  return { data, isLoading }
}

export const useUsersTotalLocked = () => {
  const { account } = useAccountStore()
  const pools = usePools()
  const poolIds = pools.data?.map((pool) => pool.address) ?? []
  const poolsTotals = useTotalInPools(pools.data ?? [])
  const userDepositsTotal = useTotalInUsersDeposits()
  const shareTokens = usePoolShareTokens(poolIds)
  const shareTokenIds =
    shareTokens.map((st) => st.data?.token.toString()).filter(isNotNil) ?? []
  const balances = useTokensBalances(shareTokenIds, account?.address)
  const totalIssuances = useTotalIssuances(shareTokenIds)

  const queries = [
    pools,
    poolsTotals,
    userDepositsTotal,
    ...shareTokens,
    ...balances,
    ...totalIssuances,
  ]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (
      !poolsTotals.data ||
      !userDepositsTotal.data ||
      shareTokens.some((q) => !q.data) ||
      balances.some((q) => !q.data) ||
      totalIssuances.some((q) => !q.data)
    )
      return undefined

    const totals = poolsTotals.data.totals.map(({ total, poolId }) => {
      const shareToken = shareTokens
        .find((st) => st.data?.poolId.toString() === poolId)
        ?.data?.token.toString()
      const balance = balances.find(
        (b) => b.data?.assetId.toString() === shareToken,
      )?.data?.balance
      const totalIssuance = totalIssuances.find(
        (ti) => ti.data?.token.toString() === shareToken,
      )?.data?.total

      if (!shareToken || !balance || !totalIssuance) return BN_0

      const ratio = balance.div(totalIssuance)

      return total.times(ratio)
    })

    const sum = totals.reduce((acc, curr) => acc.plus(curr), BN_0)
    const total = sum.plus(userDepositsTotal.data)

    return total
  }, [
    poolsTotals.data,
    userDepositsTotal.data,
    shareTokens,
    balances,
    totalIssuances,
  ])

  return { data, isLoading }
}
