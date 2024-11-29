import { Text } from "components/Typography/Text/Text"
import { Heading } from "components/Typography/Heading/Heading"
import { Trans, useTranslation } from "react-i18next"
import { useVestingScheduleEnd, useVestingTotalVestedAmount } from "api/vesting"
import { useUsdSpotPrice } from "api/spotPrice"
import { useMemo } from "react"
import { css } from "@emotion/react"
import { theme } from "theme"
import { NATIVE_ASSET_ID } from "utils/api"
import { useAssetMeta } from "api/assetMeta"
import { STable, SSeparator } from "./WalletVestingHeader.styled"
import { addDays } from "date-fns"
import { BN_0, DAY_IN_MILLISECONDS } from "utils/constants"
import { separateBalance } from "utils/balance"

export const WalletVestingHeader = () => {
  const { t } = useTranslation()

  const { data: totalVestedAmount } = useVestingTotalVestedAmount()
  const { data: vestingScheduleEnd } = useVestingScheduleEnd()

  const spotPrice = useUsdSpotPrice(NATIVE_ASSET_ID)
  const { data: nativeAsset } = useAssetMeta(NATIVE_ASSET_ID)

  const totalVestedValue = totalVestedAmount ?? BN_0

  const totalVestedUSD = useMemo(() => {
    if (totalVestedValue && spotPrice.data) {
      return totalVestedValue.times(spotPrice.data.spotPrice)
    }
    return null
  }, [totalVestedValue, spotPrice])

  return (
    <div
      sx={{ flex: ["column", "row"], align: ["normal", "center"], mb: 40 }}
      css={{ "> *:not([role='separator'])": { flex: 1 } }}
    >
      <div
        sx={{ flex: ["row", "column"], justify: ["space-between", "normal"] }}
      >
        <Text color="neutralGray300" fs={[14, 16]} sx={{ mb: 14 }}>
          {t("wallet.vesting.total_vested")}
        </Text>
        <div sx={{ flex: "column", align: ["end", "start"] }}>
          <div sx={{ flex: "row", align: "start" }}>
            <Heading as="h3" sx={{ fontSize: [16, 34], fontWeight: 900 }}>
              <Trans
                t={t}
                i18nKey="wallet.vesting.total_vested.value"
                tOptions={{
                  ...separateBalance(totalVestedValue, {
                    fixedPointScale: nativeAsset?.decimals.toString() ?? 12,
                    type: "token",
                  }),
                }}
              >
                <span
                  css={css`
                    color: rgba(${theme.rgbColors.white}, 0.4);
                    font-size: 16px;
                  `}
                />
              </Trans>
            </Heading>
          </div>
          <Text
            sx={{
              mt: 3,
            }}
            color="neutralGray300"
            fs={[10, 16]}
            lh={18}
          >
            {t("value.usd", {
              amount: totalVestedUSD,
              fixedPointScale: nativeAsset?.decimals.toNumber() ?? 12,
            })}
          </Text>
        </div>
      </div>

      {vestingScheduleEnd && (
        <STable>
          <div>
            <Text color="neutralGray300" sx={{ mb: 10 }}>
              {t("wallet.vesting.vesting_schedule_end")}
            </Text>
            <Text color="white" fs={18} fw={700}>
              {t("wallet.vesting.vesting_schedule_end_value", {
                date: addDays(
                  new Date(),
                  vestingScheduleEnd.div(DAY_IN_MILLISECONDS).toNumber(),
                ),
              })}
            </Text>
          </div>
          <SSeparator />
          <div>
            <Text color="neutralGray300" sx={{ mb: 10 }}>
              {t("wallet.vesting.vesting_days_left")}
            </Text>
            <Text color="white" fs={18} fw={700}>
              {t("wallet.vesting.vesting_days_left_value", {
                count: vestingScheduleEnd.div(DAY_IN_MILLISECONDS).isLessThan(0)
                  ? 0
                  : Math.ceil(
                      vestingScheduleEnd.div(DAY_IN_MILLISECONDS).toNumber(),
                    ),
              })}
            </Text>
          </div>
        </STable>
      )}
    </div>
  )
}
