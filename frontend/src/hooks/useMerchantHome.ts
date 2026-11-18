'use client'

/**
 * Is this account a merchant, and what does its home look like?
 *
 * One read answers both. 404 is the server saying "not a merchant", which is a
 * normal answer for every brand account and must not be retried or reported as
 * an error. Any other failure is a real one and the home shows it as such.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { merchantApi, NotMerchantError, type MerchantHomeData } from '@/services/merchantApi'

export const MERCHANT_HOME_KEY = ['merchant', 'home'] as const

export function useMerchantHome() {
  const query = useQuery({
    queryKey: MERCHANT_HOME_KEY,
    queryFn: merchantApi.home,
    retry: (count, error) => !(error instanceof NotMerchantError) && count < 1,
    staleTime: 60_000,
  })

  const notMerchant = query.error instanceof NotMerchantError

  return {
    loading: query.isPending,
    notMerchant,
    /** A failure that is not "not a merchant". */
    failed: query.isError && !notMerchant,
    data: (query.data ?? null) as MerchantHomeData | null,
    refetch: query.refetch,
  }
}

export function useInvalidateMerchant() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ['merchant'] })
}
