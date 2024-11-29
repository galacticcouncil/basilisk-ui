import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { u32 } from "@polkadot/types"
import { TradeRouter } from "@galacticcouncil/sdk"
import { BN_1, BN_NAN } from "utils/constants"
import BN from "bignumber.js"
import { useApiPromise } from "utils/api"
import { Maybe } from "utils/helpers"
import { useUsdPeggedAsset } from "./asset"

export const useSpotPrice = (
  assetA: Maybe<u32 | string>,
  assetB: Maybe<u32 | string>,
) => {
  const { tradeRouter, isLoaded } = useApiPromise()
  const tokenIn = assetA?.toString() ?? ""
  const tokenOut = assetB?.toString() ?? ""

  return useQuery(
    QUERY_KEYS.spotPrice(tokenIn, tokenOut),
    getSpotPrice(tradeRouter, tokenIn, tokenOut),
    { enabled: !!tokenIn && !!tokenOut && isLoaded },
  )
}

export const useSpotPrices = (
  assetsIn: Maybe<u32 | string>[],
  assetOut: Maybe<u32 | string>,
) => {
  const { tradeRouter } = useApiPromise()

  const assets = assetsIn
    .filter((a): a is u32 | string => !!a)
    .map((a) => a.toString())
  const tokenOut = assetOut?.toString() ?? ""

  return useQueries({
    queries: assets.map((tokenIn) => ({
      queryKey: QUERY_KEYS.spotPrice(tokenIn, tokenOut),
      queryFn: getSpotPrice(tradeRouter, tokenIn, tokenOut),
      enabled: !!tokenIn && !!tokenOut,
    })),
  })
}

export const getSpotPrice =
  (tradeRouter: TradeRouter, tokenIn: string, tokenOut: string) => async () => {
    // X -> X would return undefined, no need for spot price in such case
    if (tokenIn === tokenOut) return { tokenIn, tokenOut, spotPrice: BN_1 }

    // error replies are valid in case token has no spot price
    let spotPrice = BN_NAN
    try {
      const res = await tradeRouter.getBestSpotPrice(tokenOut, tokenIn)
      if (res) {
        spotPrice = BN_1.shiftedBy(res.decimals).div(res.amount)
      }
    } catch (e) {}

    return { tokenIn, tokenOut, spotPrice }
  }

export type SpotPrice = {
  tokenIn: string
  tokenOut: string
  spotPrice: BN
}

const STABLECOIN_SYMBOL = "kusama"

export const useCoingeckoKsmPrice = () => {
  return useQuery(QUERY_KEYS.coingeckoUsd, getCoingeckoSpotPrice, {
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: 1000 * 60 * 60 * 24, // 24h
  })
}

export const getCoingeckoSpotPrice = async () => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${STABLECOIN_SYMBOL.toLowerCase()}&vs_currencies=usd`,
  )
  const json = await res.json()
  return json[STABLECOIN_SYMBOL.toLowerCase()].usd as number
}

export const useUsdSpotPrices = (ids: Maybe<u32 | string>[]) => {
  const { tradeRouter } = useApiPromise()
  const usdId = useUsdPeggedAsset()
  const coingecko = useCoingeckoKsmPrice()

  const ksmSpotPrice = coingecko.data

  const assets = ids
    .filter((a): a is u32 | string => !!a)
    .map((a) => a.toString())

  return useQueries({
    queries: assets.map((tokenIn) => ({
      queryKey: QUERY_KEYS.spotPriceUsd(tokenIn, usdId),
      queryFn: async () => {
        const data = await getSpotPrice(tradeRouter, tokenIn, usdId)()
        const usdSpotPrice = data.spotPrice.times(ksmSpotPrice ?? 1)

        return {
          ...data,
          spotPrice: usdSpotPrice,
        }
      },
      enabled: !!tokenIn && !!usdId && !!ksmSpotPrice,
    })),
  })
}

export const useUsdSpotPrice = (id: Maybe<u32 | string>) => {
  const { isLoaded, tradeRouter } = useApiPromise()
  const usdId = useUsdPeggedAsset()
  const coingecko = useCoingeckoKsmPrice()

  const tokenIn = id?.toString() ?? ""
  const ksmSpotPrice = coingecko.data

  return useQuery(
    QUERY_KEYS.spotPriceUsd(tokenIn, usdId),
    async () => {
      const data = await getSpotPrice(tradeRouter, tokenIn, usdId)()
      const usdSpotPrice = data.spotPrice.times(ksmSpotPrice ?? 1)

      return {
        ...data,
        spotPrice: usdSpotPrice,
      }
    },
    { enabled: !!tokenIn && !!usdId && !!ksmSpotPrice && isLoaded },
  )
}
