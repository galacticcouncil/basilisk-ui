import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useAssetDetailsList } from "api/assetDetails"
import { useBestNumber } from "api/chain"
import { usePools, usePoolShareTokens } from "api/pools"
import { useUsdSpotPrices } from "api/spotPrice"
import { useTotalIssuances } from "api/totalIssuance"
import BigNumber from "bignumber.js"
import { Text } from "components/Typography/Text/Text"
import { isAfter } from "date-fns"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMedia } from "react-use"
import {
  getPositionValues,
  PositionValues,
} from "sections/pools/pool/shares/deposit/PoolSharesDeposit.utils"
import { theme } from "theme"
import { getFloatingPointAmount } from "utils/balance"
import { getEnteredDate } from "utils/block"
import { BN_0 } from "utils/constants"
import { useAllUserDeposits } from "utils/farms/deposits"
import { isNotNil } from "utils/helpers"
import { WalletPositionsTableAssetNames } from "../table/data/WalletPositionsTableAssetNames"

export const useFarmingPositionsTable = (data: FarmingPositionsTableData[]) => {
  const { t } = useTranslation()
  const { accessor } = createColumnHelper<FarmingPositionsTableData>()
  const [sorting, setSorting] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    symbol: true,
    date: isDesktop,
    shares: isDesktop,
    position: true,
  }

  const columns = [
    accessor("assets", {
      id: "name",
      header: isDesktop
        ? t("wallet.assets.farmingPositions.header.name")
        : t("selectAssets.asset"),
      sortingFn: (a, b) =>
        a.original.assets[0].symbol.localeCompare(b.original.assets[0].symbol),
      cell: ({ row }) => (
        <WalletPositionsTableAssetNames
          assetA={row.original.assets[0]}
          assetB={row.original.assets[1]}
        />
      ),
    }),
    accessor("date", {
      id: "date",
      header: t("wallet.assets.farmingPositions.header.date"),
      sortingFn: (a, b) => (isAfter(a.original.date, b.original.date) ? 1 : -1),
      cell: ({ row }) => (
        <Text fs={14} fw={500} color="white">
          {t("wallet.assets.farmingPositions.data.date", {
            date: row.original.date,
          })}
        </Text>
      ),
    }),
    accessor("shares", {
      id: "shares",
      header: t("wallet.assets.farmingPositions.header.shares"),
      sortingFn: (a, b) => (a.original.shares.gt(b.original.shares) ? 1 : -1),
      cell: ({ row }) => (
        <Text fs={14} fw={500} color="white">
          {t("value", { value: row.original.shares, type: "token" })}
        </Text>
      ),
    }),
    accessor("value", {
      id: "value",
      header: t("wallet.assets.farmingPositions.header.value"),
      sortingFn: (a, b) =>
        a.original.value?.amountUSD.gt(b.original.value?.amountUSD ?? BN_0)
          ? 1
          : -1,
      cell: ({ row }) => (
        <div sx={{ flex: "column", align: ["flex-end", "flex-start"], gap: 2 }}>
          <Text fs={14} lh={18} color="white">
            {t("value.usd", { amount: row.original.value?.amountUSD })}
          </Text>
          <Text
            fs={12}
            lh={16}
            color="neutralGray500"
            tAlign={["right", "left"]}
          >
            {t("pools.pool.positions.position.amounts", {
              amountA: row.original.value?.assetA?.amount,
              symbolA: row.original.value?.assetA?.symbol,
              amountB: row.original.value?.assetB?.amount,
              symbolB: row.original.value?.assetB?.symbol,
            })}
          </Text>
        </div>
      ),
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return table
}

export const useFarmingPositionsData = () => {
  const pools = usePools()
  const deposits = useAllUserDeposits()
  const bestNumber = useBestNumber()
  const assetDetails = useAssetDetailsList(
    pools.data?.map((pool) => pool.tokens.map((token) => token.id)).flat(),
  )
  const shareTokens = usePoolShareTokens(
    pools.data?.map((pool) => pool.address) ?? [],
  )
  const totalIssuances = useTotalIssuances(
    shareTokens.map((st) => st.data?.token),
  )

  const spotPrices = useUsdSpotPrices(
    pools.data?.map((pool) => pool.tokens.map((token) => token.id)).flat() ??
      [],
  )

  const queries = [
    pools,
    deposits,
    bestNumber,
    assetDetails,
    ...totalIssuances,

    ...spotPrices,
  ]
  const isLoading = queries.some((q) => q.isInitialLoading)

  const data = useMemo(() => {
    if (
      !pools.data ||
      !deposits.data.deposits ||
      !bestNumber.data ||
      !assetDetails.data ||
      totalIssuances.some((q) => !q.data) ||
      spotPrices.some((q) => !q.data)
    )
      return []

    const rows: FarmingPositionsTableData[] = deposits.data.deposits.map(
      (depositNft) => {
        const pool = pools.data.find(
          (p) => p.address === depositNft.deposit.ammPoolId.toString(),
        )
        const shareToken = shareTokens.find(
          (st) => st.data?.poolId.toString() === pool?.address,
        )
        const totalIssuance = totalIssuances.find(
          (ti) =>
            ti.data?.token.toString() === shareToken?.data?.token.toString(),
        )?.data?.total
        const latestEnteredAtBlock = depositNft.deposit.yieldFarmEntries.reduce(
          (acc, curr) =>
            acc.lt(curr.enteredAt.toBigNumber())
              ? curr.enteredAt.toBigNumber()
              : acc,
          BN_0,
        )

        const id = depositNft.id.toString()
        const assets =
          pool?.tokens.map((token) => {
            const details = assetDetails.data.find((ad) => ad.id === token.id)
            const id = token.id
            const symbol = token.symbol
            const name = details?.name ?? ""
            return { id, symbol, name }
          }) ?? []
        const date = getEnteredDate(
          latestEnteredAtBlock,
          bestNumber.data.relaychainBlockNumber.toBigNumber(),
        )
        const shares = getFloatingPointAmount(
          depositNft.deposit.shares.toBigNumber(),
          12,
        )

        if (!pool || !totalIssuance) {
          console.error("Missing data for value calculation")
          return { id, assets, date, shares, value: undefined }
        }

        const value = getPositionValues({
          pool,
          depositNft,
          totalIssuance,
          spotPrices: spotPrices.map((q) => q.data).filter(isNotNil),
        })

        return { id, assets, date, shares, value }
      },
    )

    return rows
  }, [
    pools.data,
    deposits.data.deposits,
    bestNumber.data,
    assetDetails.data,
    shareTokens,
    totalIssuances,
    spotPrices,
  ])

  return { data, isLoading }
}

export type FarmingPositionsTableData = {
  id: string
  assets: { id: string; symbol: string; name: string }[]
  date: Date
  shares: BigNumber
  value?: PositionValues
}
