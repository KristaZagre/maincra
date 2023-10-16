import { TransactionsArgs } from '@sushiswap/rockset-client'
import { useQuery } from '@tanstack/react-query'
import {
  getTransactions,
  getTransactionsUrl,
} from '../../../../fetchers/pool/id/transactions/transactions.js'

export const useTransactions = async (args: TransactionsArgs) => {
  return useQuery({
    queryKey: [getTransactionsUrl(args)],
    queryFn: () => getTransactions(args),
  })
}
