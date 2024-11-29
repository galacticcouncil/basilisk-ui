import { SSchedule, SInner } from "./WalletVestingSchedule.styled"
import { useCallback, useMemo } from "react"
import { Text } from "components/Typography/Text/Text"
import { Trans, useTranslation } from "react-i18next"
import { css } from "@emotion/react"
import { theme } from "theme"
import { Heading } from "components/Typography/Heading/Heading"
import { Button } from "components/Button/Button"
import {
  useNextClaimableDate,
  useVestingTotalClaimableBalance,
} from "api/vesting"
import { useUsdSpotPrice } from "api/spotPrice"
import { NATIVE_ASSET_ID, useApiPromise } from "utils/api"
import { useExistentialDeposit, useTokenBalance } from "api/balances"
import { useAccountStore, useStore } from "state/store"
import { usePaymentInfo } from "api/transaction"
import { separateBalance } from "utils/balance"
import { useAssetMeta } from "api/assetMeta"

export const WalletVestingSchedule = () => {
  const { t } = useTranslation()
  const { api } = useApiPromise()
  const { createTransaction } = useStore()
  const { account } = useAccountStore()
  const meta = useAssetMeta(NATIVE_ASSET_ID)

  const { data: claimableBalance } = useVestingTotalClaimableBalance()

  const { data: nextClaimableDate } = useNextClaimableDate()
  const { data: paymentInfoData } = usePaymentInfo(api.tx.vesting.claim())
  const { data: existentialDeposit } = useExistentialDeposit()

  const spotPrice = useUsdSpotPrice(NATIVE_ASSET_ID)
  const balance = useTokenBalance(NATIVE_ASSET_ID, account?.address)

  const claimableUSD = useMemo(() => {
    if (claimableBalance && spotPrice.data) {
      return claimableBalance.times(spotPrice.data.spotPrice)
    }
    return null
  }, [claimableBalance, spotPrice])

  const isClaimAllowed = useMemo(() => {
    if (paymentInfoData && existentialDeposit && claimableBalance) {
      return claimableBalance.isGreaterThan(
        existentialDeposit.plus(paymentInfoData.partialFee.toBigNumber()),
      )
    }

    return false
  }, [paymentInfoData, existentialDeposit, claimableBalance])

  const handleClaim = useCallback(async () => {
    return !!account?.delegate
      ? await createTransaction(
          {
            tx: api.tx.proxy.proxy(
              account?.address,
              null,
              api.tx.vesting.claimFor(account?.address),
            ),
          },
          { isProxy: true },
        )
      : await createTransaction({
          tx: api.tx.vesting.claim(),
        })
  }, [api, account, createTransaction])

  return (
    <SSchedule>
      <SInner>
        <div
          sx={{
            flex: "column",
            gap: [4, 10],
          }}
        >
          <Text color="primary200" fs={16} fw={500}>
            {t("wallet.vesting.claimable_now")}
          </Text>
          <Heading as="h3" sx={{ fontSize: [28, 42], fontWeight: 900 }}>
            <Trans
              t={t}
              i18nKey="wallet.vesting.claimable_now_value"
              tOptions={{
                ...separateBalance(claimableBalance, {
                  fixedPointScale: meta.data?.decimals.toString() ?? 12,
                  type: "token",
                }),
              }}
            >
              <span
                css={css`
                  color: rgba(${theme.rgbColors.white}, 0.4);
                  font-size: 22px;
                `}
              />
            </Trans>
          </Heading>
          <Text color="neutralGray300" fs={16} lh={18}>
            {t("value.usd", {
              amount: claimableUSD,
              fixedPointScale: meta.data?.decimals.toString() ?? 12,
            })}
          </Text>
        </div>
        <div
          sx={{
            textAlign: ["start", "center"],
          }}
        >
          {balance.data && claimableBalance && (
            <Button
              variant="gradient"
              transform="uppercase"
              onClick={handleClaim}
              disabled={
                !isClaimAllowed ||
                (account?.isExternalWalletConnected && !account?.delegate)
              }
              sx={{
                fontWeight: 800,
              }}
            >
              {t("wallet.vesting.claim_assets")}
            </Button>
          )}
          {nextClaimableDate && (
            <Text
              color="neutralGray300"
              tAlign={["left", "center"]}
              sx={{
                mt: [6, 15],
              }}
            >
              {t("wallet.vesting.estimated_claim_date", {
                date: nextClaimableDate,
              })}
            </Text>
          )}
        </div>
      </SInner>
    </SSchedule>
  )
}
