import { Trans, useTranslation } from "react-i18next"
import { SFarm, SFarmIcon, SFarmRow } from "./PoolFarmDetail.styled"
import { Text } from "components/Typography/Text/Text"
import { FillBar } from "components/FillBar/FillBar"
import { ReactComponent as ChevronDown } from "assets/icons/ChevronDown.svg"
import { AprFarm, getCurrentLoyaltyFactor } from "utils/farms/apr"
import { useAsset } from "api/asset"
import { addSeconds } from "date-fns"
import { BLOCK_TIME, BN_0, BN_QUINTILL } from "utils/constants"
import { useBestNumber } from "api/chain"
import { getFloatingPointAmount } from "utils/balance"
import { GradientText } from "components/Typography/GradientText/GradientText"
import { DepositNftType } from "api/deposits"
import { Tag } from "components/Tag/Tag"
import { PoolBase } from "@galacticcouncil/sdk"
import { useMemo } from "react"
import { Icon } from "components/Icon/Icon"

export const PoolFarmDetail = (props: {
  pool: PoolBase
  farm: AprFarm
  depositNft?: DepositNftType
  onSelect?: () => void
}) => {
  const asset = useAsset(props.farm.assetId)
  const { t } = useTranslation()
  const priceAdjustment = props.farm.globalFarm.priceAdjustment
    .toBigNumber()
    .div(BN_QUINTILL)

  const bestNumber = useBestNumber()
  const currentApr = useMemo(() => {
    if (props.depositNft) {
      const depositYield = props.depositNft.deposit.yieldFarmEntries.find(
        (farm) =>
          farm.yieldFarmId.toString() === props.farm.yieldFarm.id.toString(),
      )
      if (!depositYield) return BN_0
      const currentLoyaltyFactor = getCurrentLoyaltyFactor(
        props.farm.loyaltyCurve,
        props.farm.currentPeriod.minus(depositYield?.enteredAt.toBigNumber()),
      )

      return props.farm.apr.times(currentLoyaltyFactor)
    }
    return BN_0
  }, [props.depositNft, props.farm])

  if (!bestNumber?.data) return null

  const blockDurationToEnd = props.farm.estimatedEndBlock.minus(
    bestNumber.data.relaychainBlockNumber.toBigNumber(),
  )

  const secondsDurationToEnd = blockDurationToEnd.times(BLOCK_TIME)

  const [assetIn, assetOut] = props.pool.tokens

  const fullness = props.farm.fullness.times(100).multipliedBy(priceAdjustment)

  return (
    <SFarm
      as={props.onSelect ? "button" : "div"}
      variant={props.onSelect ? "list" : "detail"}
      onClick={props.onSelect}
      isJoined={!!props.depositNft}
    >
      {props.depositNft && <Tag>{t("pools.allFarms.modal.joined")}</Tag>}
      <div
        sx={{
          flex: ["row", "column"],
          justify: ["space-between", "start"],
          gap: 8,
        }}
      >
        <div sx={{ flex: "row", align: "center", gap: 8 }}>
          <Icon icon={asset.data?.icon} size={22} />

          <Text fw={700}>{asset.data?.symbol}</Text>
        </div>
        <Text fs={16} lh={28} fw={600} color="primary200">
          {props.farm.minApr.isEqualTo(props.farm.apr)
            ? t("value.APR", { apr: props.farm.apr })
            : t("value.APR.range", {
                from: props.farm.minApr,
                to: props.farm.apr,
              })}
        </Text>
      </div>
      <div sx={{ flex: "column" }}>
        <SFarmRow>
          <FillBar
            percentage={props.farm.distributedRewards
              .div(props.farm.potMaxBalance ?? props.farm.maxRewards)
              .times(100)
              .toNumber()}
          />
          <Text tAlign="right">
            <Trans
              t={t}
              i18nKey="pools.allFarms.modal.distribution"
              tOptions={{
                distributed: getFloatingPointAmount(
                  props.farm.distributedRewards,
                  12,
                ),
                max: getFloatingPointAmount(
                  props.farm.potMaxBalance ?? props.farm.maxRewards,
                  12,
                ),
              }}
            >
              <Text as="span" fs={14} color="neutralGray100" />
              <Text as="span" fs={14} color="neutralGray300" />
            </Trans>
          </Text>
        </SFarmRow>
        <SFarmRow>
          <FillBar percentage={fullness.toNumber()} />
          <Text fs={14} color="neutralGray100" tAlign="right">
            {t("pools.allFarms.modal.capacity", {
              capacity: fullness,
            })}
          </Text>
        </SFarmRow>
        {props.depositNft && (
          <>
            <SFarmRow>
              <GradientText fs={14} fw={550}>
                {t("pools.allFarms.modal.lockedShares")}
              </GradientText>
              <Text fs={14} color="neutralGray100" tAlign="right">
                {t("pools.allFarms.modal.lockedShares.value", {
                  value: getFloatingPointAmount(
                    props.depositNft.deposit.shares,
                    12,
                  ),
                  assetA: assetIn.symbol,
                  assetB: assetOut.symbol,
                })}
              </Text>
            </SFarmRow>
            <SFarmRow>
              <GradientText fs={14} fw={550}>
                {t("pools.pool.positions.farms.joinedFarms")}
              </GradientText>
              <GradientText
                fs={14}
                color="neutralGray100"
                tAlign="right"
                sx={{ width: "fit-content" }}
              >
                {t("value.APR", {
                  apr: currentApr,
                })}
              </GradientText>
            </SFarmRow>
          </>
        )}
        <Text fs={12} lh={16} fw={400} color="neutralGray500">
          {t("pools.allFarms.modal.end", {
            end: addSeconds(new Date(), secondsDurationToEnd.toNumber()),
          })}
        </Text>
      </div>
      {props.onSelect && (
        <SFarmIcon>
          <ChevronDown />
        </SFarmIcon>
      )}
    </SFarm>
  )
}
