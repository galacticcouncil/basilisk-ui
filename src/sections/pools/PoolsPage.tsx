import { Page } from "components/Layout/Page/Page"
import { Spacer } from "components/Spacer/Spacer"
import { useState } from "react"
import {
  PoolsPageFilter,
  useFilteredPools,
} from "sections/pools/PoolsPage.utils"
import { PoolsHeader } from "sections/pools/header/PoolsHeader"
import { Pool } from "sections/pools/pool/Pool"
import { useApiPromise } from "utils/api"
import { PoolSkeleton } from "./pool/PoolSkeleton"
import { EmptyPoolsState } from "./pool/empty/EmptyPoolsState"

export const PoolsPage = () => {
  const { isLoaded } = useApiPromise()
  if (!isLoaded)
    return (
      <Page>
        <PoolsHeader
          myPositions={false}
          disableMyPositions
          onMyPositionsChange={() => null}
        />

        <Spacer size={40} />

        <div sx={{ flex: "column", gap: 20 }}>
          {[...Array(3)].map((_, index) => (
            <PoolSkeleton key={index} length={3} index={index} />
          ))}
        </div>
      </Page>
    )

  return <PoolsPageData />
}

export const PoolsPageData = () => {
  const [filter, setFilter] = useState<PoolsPageFilter>({
    showMyPositions: false,
  })

  const { data, hasPositions, isLoading } = useFilteredPools(filter)

  return (
    <Page>
      <PoolsHeader
        myPositions={filter.showMyPositions}
        onMyPositionsChange={(value) =>
          setFilter((prev) => ({
            ...prev,
            showMyPositions: value,
          }))
        }
        disableMyPositions={!hasPositions}
      />

      <Spacer size={40} />

      <div sx={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {isLoading ? (
          <div sx={{ flex: "column", gap: 20 }}>
            {[...Array(3)].map((_, index) => (
              <PoolSkeleton key={index} length={3} index={index} />
            ))}
          </div>
        ) : !!data?.length ? (
          data.map((pool) => <Pool key={pool.address} pool={pool} />)
        ) : (
          <EmptyPoolsState />
        )}
      </div>
    </Page>
  )
}
