import { Box } from "components/Box/Box"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { SContainer } from "./PoolAddLiquidityConversion.styled"
import BigNumber from "bignumber.js"

type Props = {
  firstValue: { amount: BigNumber; currency: string }
  secondValue: { amount: BigNumber; currency: string }
}

export const PoolAddLiquidityConversion: FC<Props> = ({
  firstValue,
  secondValue,
}) => {
  const { t } = useTranslation()
  return (
    <Box flex relative height={35} acenter mt={16} mb={16}>
      <Separator color="backgroundGray800" />
      <SContainer>
        <Text fs={11} lh={15}>
          {t("pools.addLiquidity.modal.conversion.price")}
        </Text>
        <Text fs={11} lh={15} color="primary300">
          {t("value", { value: firstValue.amount })} {firstValue.currency}
        </Text>
        <Text>=</Text>
        <Text fs={11} lh={15}>
          {t("value", { value: secondValue.amount })} {secondValue.currency}
        </Text>
      </SContainer>
    </Box>
  )
}
