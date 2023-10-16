import { parseArgs } from '@sushiswap/client'
import { Transaction, TransactionsArgs } from '@sushiswap/rockset-client'

export const getTransactionsUrl = (args: TransactionsArgs) => {
  return `/pool/api/v1/pool/${args.id}/transactions${parseArgs(args)}`
}

export const getTransactions = async (
  args: TransactionsArgs,
): Promise<Transaction[]> => {
  const url = getTransactionsUrl(args)
  return fetch(url).then((data) => data.json())
}
