import { getVolumeAssetTotalValue, useTradeVolumes } from "api/volume"
import { useMemo } from "react"
import { BN_0, BN_10 } from "utils/constants"
import { useUsdSpotPrices } from "api/spotPrice"
import { useAssetMetaList } from "api/assetMeta"
import { isNotNil, normalizeId } from "../../../../utils/helpers"

export function usePoolDetailsTradeVolume(poolAddress: string) {
  const volumes = useTradeVolumes([poolAddress])

  const values = useMemo(() => {
    const volume = volumes.find(
      (volume) => volume.data?.assetId === normalizeId(poolAddress),
    )
    const sums = getVolumeAssetTotalValue(volume?.data)
    if (!volume?.data || !sums) return

    return { assets: Object.keys(sums), sums }
  }, [volumes, poolAddress])

  const assets = useAssetMetaList(values?.assets ?? [])
  const spotPrices = useUsdSpotPrices(values?.assets ?? [])

  return useMemo(() => {
    if (volumes.some((query) => query.isLoading) || !values) return null

    const combinedAssets = spotPrices.map((spotPrice) => {
      const asset = assets.data?.find(
        (asset) => asset.id === spotPrice.data?.tokenIn,
      )

      if (asset == null || spotPrice.data == null) return null
      return {
        spotPrice: spotPrice.data,
        asset: asset,
      }
    })

    return combinedAssets.reduce((acc, item) => {
      if (item == null) return acc
      const sum = values.sums[item.spotPrice.tokenIn]
      const sumScale = sum.dividedBy(BN_10.pow(item.asset.decimals.toHex()))
      return acc.plus(sumScale.multipliedBy(item.spotPrice.spotPrice))
    }, BN_0)
  }, [volumes, assets, spotPrices, values])
}

export function usePoolsDetailsTradeVolumes(poolAddresses: string[]) {
  const volumes = useTradeVolumes(poolAddresses)

  const values = useMemo(() => {
    return poolAddresses.map((poolAddress) => {
      const volume = volumes.find(
        (volume) => volume.data?.assetId === normalizeId(poolAddress),
      )
      const sums = getVolumeAssetTotalValue(volume?.data)
      if (!volume?.data || !sums) return null

      return {
        assets: Object.keys(sums),
        sums,
      }
    })
  }, [poolAddresses, volumes])

  // Get all uniques assets in pools
  const allAssetsInPools = [
    ...new Set(
      values.filter(isNotNil).reduce((acc, pool) => {
        if (!pool) return acc
        return [...acc, ...pool.assets]
      }, [] as string[]),
    ),
  ]

  const assets = useAssetMetaList(allAssetsInPools)
  const spotPrices = useUsdSpotPrices(allAssetsInPools)

  const queries = [...volumes, assets, ...spotPrices]
  const isLoading = queries.some((query) => query.isLoading)

  const data = useMemo(() => {
    if (!volumes || !values) return

    const combinedAssets = spotPrices.map((spotPrice) => {
      const asset = assets.data?.find(
        (asset) => asset.id === spotPrice.data?.tokenIn,
      )

      if (asset == null || spotPrice.data == null) return null
      return {
        spotPrice: spotPrice.data,
        asset: asset,
      }
    })

    return values.reduce((acc, pool) => {
      if (!pool) return acc

      const poolTotal = combinedAssets.reduce((acc, item) => {
        if (item == null) return acc
        const sum = pool.sums[item.spotPrice.tokenIn]
        if (!sum) return acc
        const sumScale = sum.dividedBy(BN_10.pow(item.asset.decimals.toHex()))
        return acc.plus(sumScale.multipliedBy(item.spotPrice.spotPrice))
      }, BN_0)

      return acc.plus(poolTotal)
    }, BN_0)
  }, [assets, spotPrices, values, volumes])

  return { isLoading, data }
}
