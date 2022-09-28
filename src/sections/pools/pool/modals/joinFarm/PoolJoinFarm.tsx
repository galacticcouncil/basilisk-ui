import { Modal } from "components/Modal/Modal"
import { Box } from "components/Box/Box"
import { useAPR } from "utils/apr"
import { u128, u32 } from "@polkadot/types"
import { PoolToken } from "@galacticcouncil/sdk"
import { useState } from "react"
import { PoolJoinFarmSectionList } from "./PoolJoinFarmSectionList"
import { PoolJoinFarmSectionDetail } from "./PoolJoinFarmSectionDetail"
import { PalletLiquidityMiningYieldFarmEntry } from "@polkadot/types/lookup"

export const PoolJoinFarm = (props: {
  poolId: string
  assetA: PoolToken
  assetB: PoolToken
  isOpen: boolean
  onClose: () => void
  onSelect: () => void
}) => {
  const apr = useAPR(props.poolId)

  const [selectedYieldFarmId, setSelectedYieldFarmId] =
    useState<{
      globalFarmId: u32
      yieldFarmId: u32
      yieldFarmEntry?: PalletLiquidityMiningYieldFarmEntry
    } | null>(null)

  const selectedFarm = selectedYieldFarmId
    ? apr.data.find(
        (i) =>
          i.yieldFarm.id.eq(selectedYieldFarmId.yieldFarmId) &&
          i.globalFarm.id.eq(selectedYieldFarmId.globalFarmId),
      )
    : null

  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <Box flex column gap={8} mt={24}>
        {selectedFarm != null ? (
          <PoolJoinFarmSectionDetail
            poolId={props.poolId}
            assetIn={props.assetA}
            assetOut={props.assetB}
            farm={selectedFarm}
            yieldFarmEntry={selectedYieldFarmId?.yieldFarmEntry}
            onBack={() => setSelectedYieldFarmId(null)}
          />
        ) : (
          <PoolJoinFarmSectionList
            poolId={props.poolId}
            assetIn={props.assetA}
            assetOut={props.assetB}
            onSelect={setSelectedYieldFarmId}
          />
        )}
      </Box>
    </Modal>
  )
}
