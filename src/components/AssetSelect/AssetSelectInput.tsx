import { ReactComponent as ChevronDown } from "assets/icons/ChevronDown.svg"
import { AssetInput } from "components/AssetInput/AssetInput"
import { Icon } from "components/Icon/Icon"
import { Text } from "components/Typography/Text/Text"
import { ReactNode, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { SSelectAssetButton } from "./AssetSelectInput.styled"
import { u32 } from "@polkadot/types"
import BigNumber from "bignumber.js"
import { getFloatingPointAmount } from "utils/balance"
import { useAsset } from "api/asset"
import { useUsdSpotPrice } from "api/spotPrice"
import { Maybe } from "utils/helpers"
import { TokenInputContainer, TokenInputMaxButton } from "./TokenInput"

export const AssetSelectInput = (props: {
  name: string
  value: string

  title: ReactNode
  className?: string

  asset: u32 | string
  assetIcon: Maybe<ReactNode>
  decimals: Maybe<number>
  balance: Maybe<BigNumber>

  onChange: (v: string) => void
  onSelectAssetClick: () => void

  error?: string
  disabled?: boolean
}) => {
  const { t } = useTranslation()
  const spotPrice = useUsdSpotPrice(props.asset)

  const asset = useAsset(props.asset)

  const aUSDValue = useMemo(() => {
    if (!props.value) return 0
    if (spotPrice.data?.spotPrice == null) return null
    return spotPrice.data.spotPrice.times(props.value)
  }, [props.value, spotPrice.data])

  return (
    <TokenInputContainer className={props.className}>
      <Text fw={500} lh={22} color="primary200" css={{ gridArea: "title" }}>
        {props.title}
      </Text>
      <div
        sx={{ flex: "row", align: "center", pt: [5, 0], justify: "end" }}
        css={{ gridArea: "balance" }}
      >
        <Text fs={12} lh={16} color="white" sx={{ mr: 5 }}>
          <Trans
            t={t}
            i18nKey="selectAsset.balance"
            tOptions={{
              balance: props.balance,
              fixedPointScale: props.decimals,
              type: "token",
            }}
          >
            <span css={{ opacity: 0.7 }} />
          </Trans>
        </Text>
        <TokenInputMaxButton
          disabled={props.disabled}
          onClick={() => {
            if (props.decimals != null && props.balance != null) {
              props.onChange(
                getFloatingPointAmount(
                  props.balance,
                  props.decimals,
                ).toString(),
              )
            }
          }}
        />
      </div>
      <div
        sx={{ flex: "row", align: "center", justify: "space-between" }}
        css={{ gridArea: "input" }}
      >
        <SSelectAssetButton size="small" onClick={props.onSelectAssetClick}>
          <Icon icon={props.assetIcon} size={32} />
          {asset.data ? (
            <div>
              <Text fw={700} color="white">
                {asset.data?.symbol}
              </Text>
              <Text
                css={{ whiteSpace: "nowrap" }}
                color="neutralGray400"
                fs={12}
                lh={14}
              >
                {asset.data?.name}
              </Text>
            </div>
          ) : (
            <Text css={{ whiteSpace: "nowrap" }}>{t("selectAsset.title")}</Text>
          )}
          <Icon sx={{ color: "iconGray" }} icon={<ChevronDown />} />
        </SSelectAssetButton>
        <AssetInput
          name={props.name}
          label={t("selectAsset.input.label")}
          value={props.value}
          onChange={props.onChange}
          error={props.error}
          dollars={t("value.usd", { amount: aUSDValue })}
          unit={asset.data?.symbol}
          placeholder="0"
          disabled={props.disabled}
        />
      </div>
    </TokenInputContainer>
  )
}
