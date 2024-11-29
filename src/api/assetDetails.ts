import { NATIVE_ASSET_ID, useApiPromise } from "utils/api"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { ApiPromise } from "@polkadot/api"
import { u32 } from "@polkadot/types"
import { Maybe, normalizeId, isNotNil } from "utils/helpers"
import { useAccountBalances } from "./accountBalances"
import { AccountId32 } from "@polkadot/types/interfaces"
import { PalletAssetRegistryAssetType } from "@polkadot/types/lookup"
import { BN_0 } from "utils/constants"

export const useAssetDetails = (id: Maybe<u32 | string>) => {
  const { api } = useApiPromise()
  return useQuery(QUERY_KEYS.assets, getAssetDetails(api), {
    select: (data) => data.find((i) => i.id === id?.toString()),
  })
}

interface AssetDetailsListFilter {
  assetType: PalletAssetRegistryAssetType["type"][]
}

export const useAssetDetailsList = (
  ids?: Maybe<u32 | string>[],
  filter: AssetDetailsListFilter = {
    assetType: ["Token"],
  },
) => {
  const { api, isLoaded } = useApiPromise()

  const normalizedIds = ids?.filter(isNotNil).map(normalizeId)

  return useQuery(QUERY_KEYS.assets, getAssetDetails(api), {
    select: (data) => {
      const normalized =
        normalizedIds != null
          ? data.filter((i) => normalizedIds?.includes(i.id))
          : data

      return normalized.filter((asset) =>
        filter.assetType.includes(asset.assetType),
      )
    },
    enabled: !!isLoaded,
  })
}

export const useAssetAccountDetails = (
  address: Maybe<AccountId32 | string>,
) => {
  const accountBalances = useAccountBalances(address)

  const ids = accountBalances.data?.balances
    ? [NATIVE_ASSET_ID, ...accountBalances.data.balances.map((b) => b.id)]
    : []

  return useAssetDetailsList(ids)
}

const getAssetDetails = (api: ApiPromise) => async () => {
  const [system, entries, meta] = await Promise.all([
    api.rpc.system.properties(),
    api.query.assetRegistry.assets.entries(),
    api.query.assetRegistry.assetMetadataMap.entries(),
  ])

  const assetsMeta = meta.map(([key, data]) => {
    return {
      id: key.args[0].toString(),
      //@ts-ignore
      symbol: data.unwrap().symbol.toUtf8(),
    }
  })

  if (!assetsMeta.find((i) => i.id === NATIVE_ASSET_ID)) {
    const [symbol] = system.tokenSymbol.unwrap()

    assetsMeta.push({
      id: NATIVE_ASSET_ID,
      symbol: symbol.toString(),
    })
  }

  const assets = entries
    .map(([key, data]) => {
      const { symbol = "N/A" } =
        assetsMeta.find(
          (assetMeta) => assetMeta.id.toString() === key.args[0].toString(),
        ) || {}

      return {
        id: key.args[0].toString(),
        //@ts-ignore
        name: data.unwrap().name.toUtf8(),
        assetType: data.unwrap().assetType.type,
        existentialDeposit: data.unwrap().existentialDeposit.toBigNumber(),
        symbol,
      }
    })
    .filter((asset) => !asset.name.includes("deprecated"))

  if (!assets.find((i) => i.id === NATIVE_ASSET_ID)) {
    const { symbol = "N/A" } =
      assetsMeta.find(
        (assetMeta) => assetMeta.id.toString() === NATIVE_ASSET_ID,
      ) || {}

    assets.push({
      id: NATIVE_ASSET_ID,
      name: system.tokenSymbol.unwrap()[0].toString(),
      assetType: "Token",
      existentialDeposit: BN_0,
      symbol,
    })
  }

  return assets
}
