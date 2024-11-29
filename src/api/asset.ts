import { useAssetMeta } from "./assetMeta"
import { useAssetDetails, useAssetDetailsList } from "./assetDetails"
import { getAssetLogo } from "components/AssetIcon/AssetIcon"
import { u32 } from "@polkadot/types"
import { Maybe, useQueryReduce } from "utils/helpers"
import { TradeRouter } from "@galacticcouncil/sdk"
import { useApiPromise } from "utils/api"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"

export const useAsset = (id: Maybe<u32 | string>) => {
  const detail = useAssetDetails(id)
  const meta = useAssetMeta(id)

  return useQueryReduce([detail, meta] as const, (detail, meta) => {
    if (detail == null || meta == null) return undefined
    return {
      ...detail,
      decimals: meta?.decimals,
      symbol: meta?.symbol,
      icon: getAssetLogo(detail?.symbol),
    }
  })
}

export const useUsdPeggedAsset = () => {
  const assets = useAssetDetailsList()

  const usdId = assets.data?.find(
    (asset) =>
      asset.symbol.toLowerCase() ===
      import.meta.env.VITE_USD_PEGGED_ASSET_NAME.toLowerCase(),
  )

  return usdId?.id ?? ""
}

export const useTradeAssets = () => {
  const { tradeRouter } = useApiPromise()
  return useQuery(QUERY_KEYS.tradeAssets, getTradeAssets(tradeRouter))
}

const getTradeAssets = (tradeRouter: TradeRouter) => async () => {
  return tradeRouter.getAllAssets()
}
