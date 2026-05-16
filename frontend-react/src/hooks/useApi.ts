import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic typed data-fetching hook.
 * @param fetchFn  - API function from services/api.ts
 * @param params   - Query parameters (triggers refetch when changed)
 * @param deps     - Additional dependency triggers (e.g. a refresh counter)
 */
export function useApi<T, P extends object = Record<string, unknown>>(
  fetchFn: (params: P) => Promise<T>,
  params: P = {} as P,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = JSON.stringify(params)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(params)
      if (isMounted.current) setData(result)
    } catch (err: unknown) {
      if (isMounted.current) {
        const msg =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          'Unknown error'
        setError(msg)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, ...deps])

  useEffect(() => { void load() }, [load])

  return { data, loading, error, refetch: load }
}
