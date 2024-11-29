import { AccountId32 } from "@polkadot/types/interfaces"
import { NATIVE_ASSET_ID, useApiPromise } from "utils/api"
import { useQueries, useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "utils/queryKeys"
import { ApiPromise } from "@polkadot/api"
import { Maybe, undefinedNoop } from "utils/helpers"
import { u32, u128 } from "@polkadot/types"
import { PalletBalancesAccountData } from "@polkadot/types/lookup"
import { BN } from "@polkadot/util"
interface PalletBalancesAccountDataCustom extends PalletBalancesAccountData {
  frozen: u128
}

export const useAccountBalances = (id: Maybe<AccountId32 | string>) => {
  const { api } = useApiPromise()
  return useQuery(
    QUERY_KEYS.accountBalances(id),
    !!id ? getAccountBalances(api, id) : undefinedNoop,
    { enabled: id != null },
  )
}

export const useAccountsBalances = (addresses: string[]) => {
  const { api } = useApiPromise()

  return useQueries({
    queries: addresses.map((address) => ({
      queryKey: QUERY_KEYS.accountBalances(address),
      queryFn:  async () => {
       const data = await getAccountBalances(api, address)()

       return {...data, address}
      },
      enabled: !!address,
    })),
  })

}

const getAccountBalances =
  (api: ApiPromise, accountId: AccountId32 | string) => async () => {
    const [tokens, native] = await Promise.all([
      api.query.tokens.accounts.entries(accountId),
      api.query.system.account(accountId),
    ])
    const balances = tokens.map(([key, data]) => {
      const [, id] = key.args
      return { id, data }
    })

    return { native, balances }
  }

const getTokenAccountBalancesList =
  (
    api: ApiPromise,
    pairs: Array<[address: AccountId32 | string, assetId: u32 | string]>,
  ) =>
  async () => {
    try {
      const [tokens, natives] = await Promise.all([
        api.query.tokens.accounts.multi(
          pairs.filter(
            ([_, assetId]) => assetId.toString() !== NATIVE_ASSET_ID,
          ),
        ),
        api.query.system.account.multi(
          pairs
            .filter(([_, assetId]) => assetId.toString() === NATIVE_ASSET_ID)
            .map(([account]) => account),
        ),
      ])

      const values: Array<{
        free: BN
        reserved: BN
        frozen: BN
      }> = []

      for (
        let tokenIdx = 0, nativeIdx = 0;
        tokenIdx + nativeIdx < pairs.length;

      ) {
        const idx = tokenIdx + nativeIdx
        const [, assetId] = pairs[idx]

        if (assetId.toString() === NATIVE_ASSET_ID) {
          //@ts-ignore
          let { data }: { data: PalletBalancesAccountDataCustom } =
            natives[nativeIdx]

          const frozen = data.frozen

          values.push({
            free: data.free,
            reserved: data.reserved,
            frozen,
          })

          nativeIdx += 1
        } else {
          values.push({
            free: tokens[tokenIdx].free,
            reserved: tokens[tokenIdx].reserved,
            frozen: tokens[tokenIdx].frozen,
          })

          tokenIdx += 1
        }
      }

      return values
    } catch (err) {
      console.error(err)
    }
  }

export const useTokenAccountBalancesList = (
  pairs: Array<[address: AccountId32 | string, assetId: u32 | string]>,
) => {
  const { api } = useApiPromise()

  return useQuery(
    QUERY_KEYS.tokenAccountBalancesList(pairs),
    getTokenAccountBalancesList(api, pairs),
    { enabled: pairs.length > 0 },
  )
}
