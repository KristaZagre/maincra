import { Transaction, TransactionsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import type { QueryParams } from 'lib/flair/hooks/common.js'
import {
  getTransactions,
  getTransactionsUrl,
} from '../../../../fetchers/pool/id/transactions/transactions'

export const useTransactions = (
  args: TransactionsArgs,
  queryParams?: QueryParams<Transaction[]>,
) => {
  return useQuery({
    ...queryParams,
    queryKey: [getTransactionsUrl(args)],
    queryFn: () => getTransactions(args),
  })
}
