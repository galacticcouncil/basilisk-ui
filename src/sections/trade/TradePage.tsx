import { Page } from "components/Layout/Page/Page"
import { SContainer } from "./TradePage.styled"

import type { TxInfo } from "@galacticcouncil/apps"
import { Ecosystem } from "@galacticcouncil/apps"

import * as React from "react"
import * as Apps from "@galacticcouncil/apps"
import { createComponent, EventName } from "@lit-labs/react"
import { useAccountStore, useStore } from "state/store"
import { z } from "zod"
import { MakeGenerics, useSearch } from "@tanstack/react-location"
import { useProviderRpcUrlStore } from "api/provider"
import { useApiPromise } from "utils/api"
import { useUsdSpotPrice } from "api/spotPrice"
import { useSpotPrice } from "../../api/spotPrice"
import { useUsdPeggedAsset } from "api/asset"

export const TradeApp = createComponent({
  tagName: "gc-trade",
  elementClass: Apps.TradeApp,
  react: React,
  events: {
    onTxNew: "gc:tx:new" as EventName<CustomEvent<TxInfo>>,
  },
})

const TradeAppSearch = z.object({
  assetIn: z
    .number()
    .transform((value) => String(value))
    .optional(),
  assetOut: z
    .number()
    .transform((value) => String(value))
    .optional(),
})

type SearchGenerics = MakeGenerics<{
  Search: z.infer<typeof TradeAppSearch>
}>

const grafanaUrl = import.meta.env.VITE_GRAFANA_URL
const grafanaDsn = import.meta.env.VITE_GRAFANA_DSN

export const TradeWrapper = () => {
  const { isLoaded } = useApiPromise()

  if (!isLoaded) return null

  return <TradePage />
}

export function TradePage() {
  const { api } = useApiPromise()
  const { account } = useAccountStore()
  const { createTransaction } = useStore()
  const preference = useProviderRpcUrlStore()
  const rpcUrl = preference.rpcUrl ?? import.meta.env.VITE_PROVIDER_URL

  const rawSearch = useSearch<SearchGenerics>()
  const usdAssetId = import.meta.env.VITE_USD_PEGGED_ASSET_ID
  const search = TradeAppSearch.safeParse(rawSearch)
  const peggedAssetId = useUsdPeggedAsset()

  const usdPrice = useUsdSpotPrice(peggedAssetId)
  const spotPrice = useSpotPrice(peggedAssetId, usdAssetId)

  const rate = usdPrice.data?.spotPrice.div(spotPrice.data?.spotPrice ?? 1)

  const handleSubmit = async (e: CustomEvent<TxInfo>) => {
    const { transaction, notification } = e.detail
    await createTransaction(
      {
        tx: api.tx(transaction.hex),
      },
      {
        onSuccess: () => {},
        toast: {
          onLoading: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.processing.rawHtml,
              }}
            />
          ),
          onSuccess: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.success.rawHtml,
              }}
            />
          ),
          onError: (
            <span
              dangerouslySetInnerHTML={{
                __html: notification.failure.rawHtml,
              }}
            />
          ),
        },
      },
    )
  }

  // TODO: Revert when Kusama stable coin asset
  const assetIn =
    search.success && search.data.assetIn ? search.data.assetIn : "1" //kusama
  const assetOut =
    search.success && search.data.assetOut ? search.data.assetOut : "0" // basilsik

  return (
    <Page>
      <SContainer>
        <TradeApp
          ref={(r) => {
            if (r) {
              r.setAttribute("chart", "")
            }
          }}
          onTxNew={(e) => handleSubmit(e)}
          ecosystem={Ecosystem.Kusama}
          accountName={account?.name}
          accountProvider={account?.provider}
          accountAddress={account?.address}
          apiAddress={rpcUrl}
          grafanaUrl={grafanaUrl}
          grafanaDsn={grafanaDsn}
          stableCoinAssetId={usdAssetId}
          stableCoindRate={rate?.toString()}
          assetIn={assetIn}
          assetOut={assetOut}
        />
      </SContainer>
    </Page>
  )
}
