import type { u32 } from "@polkadot/types"
import { u128 } from "@polkadot/types-codec"
import type { AccountId32 } from "@polkadot/types/interfaces"
import { CodecHash } from "@polkadot/types/interfaces/runtime"
import type BigNumber from "bignumber.js"
import { Maybe } from "utils/helpers"

export const QUERY_KEY_PREFIX = "@block"

export const QUERY_KEYS = {
  providerAccounts: (provider: string | undefined) => [
    "web3Accounts",
    provider,
  ],
  walletEnable: (provider: string | null) => ["web3Enable", provider],
  bestNumber: [QUERY_KEY_PREFIX, "bestNumber"],
  accountBalances: (id: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "accountBalances",
    id?.toString(),
  ],
  tokenAccountBalancesList: (
    pairs: Array<[address: AccountId32 | string, assetId: u32 | string]>,
  ) => [QUERY_KEY_PREFIX, "tokenAccountBalancesList", pairs],
  pools: [QUERY_KEY_PREFIX, "pools"],
  poolShareToken: (poolId: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "poolShareToken",
    poolId.toString(),
  ],
  poolAssets: (address: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "poolAssets",
    address.toString(),
  ],
  deposit: (id: Maybe<u128>) => [QUERY_KEY_PREFIX, "deposit", id?.toString()],
  deposits: (poolId?: string) => [QUERY_KEY_PREFIX, "deposits", poolId],
  accountDepositIds: (accountId: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "depositIds",
    accountId?.toString(),
  ],
  globalFarms: (ids: u32[]) => [
    QUERY_KEY_PREFIX,
    "globalFarms",
    ...ids.map((i) => i.toString()),
  ],
  yieldFarms: (ids: Record<string, any>) => [
    QUERY_KEY_PREFIX,
    "yieldFarms",
    ids,
  ],
  activeYieldFarms: (poolId: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "activeYieldFarms",
    poolId.toString(),
  ],
  inactiveYieldFarms: (poolId: AccountId32 | string) => [
    "inactiveYieldFarms",
    poolId.toString(),
  ],
  globalFarm: (id: u32) => [QUERY_KEY_PREFIX, "globalFarm", id.toString()],
  yieldFarm: (ids: {
    poolId: AccountId32 | string
    globalFarmId: u32 | string
    yieldFarmId: u32 | string
  }) => [QUERY_KEY_PREFIX, "yieldFarm", ids],
  activeYieldFarm: (id: string) => [QUERY_KEY_PREFIX, "activeYieldFarm", id],
  totalLiquidity: (id: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "totalLiquidity",
    id?.toString(),
  ],
  totalIssuance: (lpToken: Maybe<u32>) => [
    QUERY_KEY_PREFIX,
    "totalIssuance",
    lpToken?.toString(),
  ],
  totalLiquidities: (ids: string[]) => [
    QUERY_KEY_PREFIX,
    "totalLiquidities",
    ...ids,
  ],
  tokenBalance: (
    id: Maybe<string | u32>,
    address: Maybe<AccountId32 | string>,
  ) => [QUERY_KEY_PREFIX, "tokenBalance", id?.toString(), address],
  tokensBalances: (ids: string[], address?: string) => [
    QUERY_KEY_PREFIX,
    "tokenBalances",
    address,
    ...ids,
  ],
  assets: [QUERY_KEY_PREFIX, "assets"],
  assetsMeta: [QUERY_KEY_PREFIX, "assetsMeta"],
  tradeAssets: [QUERY_KEY_PREFIX, "tradeAssets"],
  exchangeFee: [QUERY_KEY_PREFIX, "exchangeFee"],
  calculateTotalLiqInPools: [QUERY_KEY_PREFIX, "totalLiqInPools"],
  spotPrice: (assetA: string, assetB: string) => [
    QUERY_KEY_PREFIX,
    "spotPrice",
    assetA,
    assetB,
  ],
  spotPriceUsd: (assetA: string, assetB: string) => [
    QUERY_KEY_PREFIX,
    "spotPriceUsd",
    assetA,
    assetB,
  ],
  paymentInfo: (hash: CodecHash, account?: AccountId32 | string) => [
    QUERY_KEY_PREFIX,
    "paymentInfo",
    hash,
    account,
  ],
  nextNonce: (account: Maybe<AccountId32 | string>) => [
    QUERY_KEY_PREFIX,
    "nonce",
    account,
  ],
  bestBuy: (params: Record<string, any>) => [
    QUERY_KEY_PREFIX,
    "bestBuy",
    params,
  ],
  bestSell: (params: Record<string, any>) => [
    QUERY_KEY_PREFIX,
    "bestSell",
    params,
  ],
  mathLoyaltyRates: (
    plannedYieldingPeriods: u32,
    initialRewardPercentage: Maybe<u128>,
    scaleCoef: Maybe<u32>,
    periodsInFarm: Maybe<string>,
  ) => [
    "mathLoyaltyRates",
    plannedYieldingPeriods,
    initialRewardPercentage?.toString(),
    scaleCoef?.toString(),
    periodsInFarm,
  ],
  tradeVolume: (poolId: Maybe<string>) => [
    QUERY_KEY_PREFIX,
    "tradeVolume",
    poolId,
  ],
  timestamp: (bestNumber: Maybe<u32 | BigNumber>) =>
    bestNumber != null
      ? ["timestamp", bestNumber]
      : [QUERY_KEY_PREFIX, "timestamp"],
  vestingSchedules: (address: Maybe<AccountId32 | string>) => [
    "vestingSchedules",
    address,
  ],
  vestingLockBalance: (address: Maybe<AccountId32 | string>) => [
    "vestingLock",
    address,
  ],
  lock: (address: Maybe<AccountId32 | string>, asset: Maybe<u32 | string>) => [
    "lock",
    address,
    asset,
  ],
  provider: (url: string) => ["provider", url],
  math: ["@galacticcouncil/math"],
  existentialDeposit: ["existentialDeposit"],
  metadataVersion: ["metadataVersion"],
  acceptedCurrencies: (address: Maybe<u32 | string>) => [
    "acceptedCurrencies",
    address,
  ],
  accountCurrency: (address: Maybe<AccountId32 | string>) => [
    "accountCurrency",
    address,
  ],
  externalWalletKey: (walletAddress: string) => [
    "externalWallet",
    walletAddress,
  ],
  polkadotAccounts: ["polkadotAccounts"],
  coingeckoUsd: ["coingeckoUsd"],
} as const
