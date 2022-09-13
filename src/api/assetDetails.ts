import { useApiPromise } from "utils/network"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { ApiPromise } from "@polkadot/api"
import { u32 } from "@polkadot/types"
import { Maybe } from "utils/types"

export const useAssetDetails = (id: Maybe<u32>) => {
  const api = useApiPromise()

  return useQuery(
    QUERY_KEYS.assetDetails(id?.toString()),
    getAssetDetails(api, id),
    { enabled: !!id },
  )
}

export const getAssetDetails =
  (api: ApiPromise, id: Maybe<u32>) => async () => {
    if (id == null) throw new Error("Missing ID for asset details")

    const res = await api.query.assetRegistry.assets(id)
    const data = res.toHuman() as {
      name: string
      assetType: "Token" | { PoolShare: string[] }
      existentialDeposit: any
      locked: boolean
    }
    return data
  }
