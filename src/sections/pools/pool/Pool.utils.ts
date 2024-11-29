import { PoolBase } from "@galacticcouncil/sdk"
import { useUsdSpotPrice, useUsdSpotPrices } from "api/spotPrice"
import BN from "bignumber.js"
import { useMemo } from "react"
import { getFloatingPointAmount } from "utils/balance"
import { BN_0 } from "utils/constants"

export const useTotalInPool = (pool: PoolBase) => {
  const [assetA, assetB] = pool.tokens

  const spotAtoAUSD = useUsdSpotPrice(assetA.id)
  const spotBtoAUSD = useUsdSpotPrice(assetB.id)

  const queries = [spotAtoAUSD, spotBtoAUSD]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (!spotAtoAUSD.data || !spotBtoAUSD.data) return undefined

    const balanceA = getFloatingPointAmount(
      new BN(assetA.balance),
      assetA.decimals,
    )
    const balanceB = getFloatingPointAmount(
      new BN(assetB.balance),
      assetB.decimals,
    )

    const totalA = balanceA.times(spotAtoAUSD.data.spotPrice)
    const totalB = balanceB.times(spotBtoAUSD.data.spotPrice)
    const total = totalA.plus(totalB)

    return total
  }, [assetA, assetB, spotAtoAUSD.data, spotBtoAUSD.data])

  return { data, isLoading }
}

export const useTotalInPools = (pools: PoolBase[]) => {
  const tokens = pools.map(({ tokens }) => tokens.map(({ id }) => id)).flat()

  const spotPrices = useUsdSpotPrices(tokens)

  const queries = spotPrices
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (spotPrices.some((q) => !q.data)) return undefined

    const totals = pools.map((pool) => {
      const poolId = pool.address
      const [assetA, assetB] = pool.tokens

      const spotA = spotPrices.find((sp) => sp.data?.tokenIn === assetA.id)
      const spotB = spotPrices.find((sp) => sp.data?.tokenIn === assetB.id)
      const balanceA = getFloatingPointAmount(
        new BN(assetA.balance),
        assetA.decimals,
      )
      const balanceB = getFloatingPointAmount(
        new BN(assetB.balance),
        assetB.decimals,
      )

      if (!spotA?.data?.spotPrice || !spotB?.data?.spotPrice)
        return { total: BN_0, poolId }

      const totalA = balanceA.times(spotA.data?.spotPrice)
      const totalB = balanceB.times(spotB.data?.spotPrice)
      const total = totalA.plus(totalB)

      return { total, poolId }
    })

    const total = totals.reduce((acc, curr) => acc.plus(curr.total), BN_0)

    return { total, totals }
  }, [pools, spotPrices])

  return { data, isLoading }
}
