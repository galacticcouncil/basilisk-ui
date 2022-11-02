import BN from "bignumber.js"
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { BN_0 } from "utils/constants"
import {
  WalletAssetsTableBalance,
  WalletAssetsTableName,
} from "sections/wallet/assets/table/data/WalletAssetsTableData"
import { WalletAssetsTableActions } from "sections/wallet/assets/table/actions/WalletAssetsTableActions"
import Skeleton from "react-loading-skeleton"
import { useMedia } from "react-use"
import { theme } from "theme"

export const useAssetsTable = () => {
  const { t } = useTranslation()
  const { accessor, display } = createColumnHelper<TestData>()
  const [sorting, setSorting] = useState<SortingState>([])

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    name: true,
    transferable: isDesktop,
    total: true,
    actions: true,
  }

  const columns = [
    accessor("symbol", {
      id: "name",
      header: t("wallet.assets.table.header.name"),
      cell: ({ row }) => <WalletAssetsTableName {...row.original} />,
    }),
    accessor("transferable", {
      id: "transferable",
      header: t("wallet.assets.table.header.transferable"),
      sortingFn: (a, b) =>
        a.original.transferable.gt(b.original.transferable) ? 1 : -1,
      cell: ({ row }) => (
        <WalletAssetsTableBalance
          balance={row.original.transferable}
          balanceUSD={row.original.transferableUSD}
        />
      ),
    }),
    accessor("total", {
      id: "total",
      header: t("wallet.assets.table.header.total"),
      sortingFn: (a, b) => (a.original.total.gt(b.original.total) ? 1 : -1),
      cell: ({ row }) => (
        <WalletAssetsTableBalance
          balance={row.original.total}
          balanceUSD={row.original.totalUSD}
        />
      ),
    }),
    display({
      id: "actions",
      cell: ({ row }) => (
        <WalletAssetsTableActions
          toggleExpanded={() => row.toggleExpanded()}
          symbol={row.original.symbol}
        />
      ),
    }),
  ]

  return useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}

export const useAssetsTableSkeleton = (enableAnimation = true) => {
  const { t } = useTranslation()
  const { display } = createColumnHelper()

  const isDesktop = useMedia(theme.viewport.gte.sm)
  const columnVisibility: VisibilityState = {
    name: true,
    transferable: isDesktop,
    total: true,
    actions: true,
  }

  const columns = [
    display({
      id: "name",
      header: t("wallet.assets.table.header.name"),
      cell: () => (
        <div sx={{ flex: "row", gap: 8, height: [24, 32] }}>
          <div sx={{ width: [24, 32] }}>
            <Skeleton
              circle
              width="100%"
              height="100%"
              enableAnimation={enableAnimation}
            />
          </div>
          <Skeleton
            width={64}
            height="100%"
            borderRadius={9999}
            enableAnimation={enableAnimation}
          />
        </div>
      ),
    }),
    display({
      id: "transferable",
      header: t("wallet.assets.table.header.transferable"),
      cell: () => (
        <div>
          <Skeleton
            width={134}
            height={32}
            borderRadius={9999}
            enableAnimation={enableAnimation}
          />
        </div>
      ),
    }),
    display({
      id: "total",
      header: t("wallet.assets.table.header.total"),
      cell: () => (
        <div
          sx={{ width: [90, 134], height: [24, 32], ml: ["auto", "initial"] }}
        >
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={9999}
            enableAnimation={enableAnimation}
          />
        </div>
      ),
    }),
    display({
      id: "actions",
      cell: () => (
        <div sx={{ flex: "row", gap: 8, mr: 32, display: ["none", "flex"] }}>
          <Skeleton
            width={72}
            height={32}
            borderRadius={9999}
            enableAnimation={enableAnimation}
          />
          <Skeleton
            width={72}
            height={32}
            borderRadius={9999}
            enableAnimation={enableAnimation}
          />
          <Skeleton
            width={32}
            height={32}
            circle
            enableAnimation={enableAnimation}
          />
        </div>
      ),
    }),
  ]

  return useReactTable({
    data: mockData,
    columns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
  })
}

const mockData = [1, 2, 3, 4, 5]

const data: TestData[] = [
  {
    symbol: "BSX",
    name: "Basilisk",
    transferable: new BN(545673.14323),
    transferableUSD: new BN(3452.5884),
    total: new BN(1000000),
    totalUSD: new BN(6000),
    locked: new BN(30400),
    lockedUSD: new BN(122.836),
    origin: "Basilisk",
  },
  {
    symbol: "KAR",
    name: "Karura",
    transferable: BN_0,
    transferableUSD: BN_0,
    total: BN_0,
    totalUSD: BN_0,
    locked: BN_0,
    lockedUSD: BN_0,
    origin: "Kusama",
  },
  {
    symbol: "PHA",
    name: "Phala",
    transferable: new BN(145430.23334),
    transferableUSD: new BN(3000),
    total: new BN(1000000),
    totalUSD: new BN(6000),
    locked: new BN(10000),
    lockedUSD: new BN(150),
    origin: "Kusama",
  },
  {
    symbol: "KSM",
    name: "Kusama",
    transferable: new BN(10023.2445),
    transferableUSD: new BN(3000),
    total: new BN(1000000),
    totalUSD: new BN(6000),
    locked: new BN(10000),
    lockedUSD: new BN(150),
    origin: "Kusama",
  },
]

type TestData = {
  symbol: string
  name: string
  transferable: BN
  transferableUSD: BN
  total: BN
  totalUSD: BN
  locked: BN
  lockedUSD: BN
  origin: string
}