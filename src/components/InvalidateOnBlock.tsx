import { useQueryClient } from "@tanstack/react-query"
import { ReactNode, useEffect } from "react"
import { useApiPromise } from "utils/api"
import { QUERY_KEY_PREFIX } from "utils/queryKeys"

export const InvalidateOnBlock = (props: { children: ReactNode }) => {
  const { api, isLoaded } = useApiPromise()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isLoaded && api) {
      let cancel: () => void

      api.rpc.chain
        .subscribeNewHeads(() => {
          queryClient.invalidateQueries([QUERY_KEY_PREFIX])
        })
        .then((newCancel) => (cancel = newCancel))

      return () => cancel?.()
    }
  }, [api, queryClient, isLoaded])

  return <>{props.children}</>
}
