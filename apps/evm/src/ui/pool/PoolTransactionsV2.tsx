'use client'

import {
  Pool,
  Transaction as _Transaction,
  TransactionType,
} from '@sushiswap/rockset-client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
} from '@sushiswap/ui'
import { Toggle } from '@sushiswap/ui/components/toggle'
import { isSushiSwapV2ChainId } from '@sushiswap/v2-sdk'
import { useQuery } from '@tanstack/react-query'
import { PaginationState } from '@tanstack/react-table'
import {
  ExtendedPool,
  useExtendedPool,
} from 'src/lib/hooks/api/useFlairPoolGraphData'
import { FC, useMemo, useState } from 'react'
import { Chain, ChainId } from 'sushi/chain'
import { Amount } from 'sushi/currency'

import { getTransactions } from 'src/lib/flair/fetchers/pool/id/transactions/transactions'
import { ID } from 'sushi/types'
import {
  TX_AMOUNT_IN_V2_COLUMN,
  TX_AMOUNT_OUT_V2_COLUMN,
  TX_AMOUNT_USD_V2_COLUMN,
  TX_CREATED_TIME_V2_COLUMN,
  TX_SENDER_V2_COLUMN,
} from './columns'

interface UseTransactionsV2Opts {
  type: TransactionType
  refetchInterval?: number
  first: number
  skip?: number
}

function useTransactionsV2(
  pool: ExtendedPool,
  poolId: ID,
  opts: UseTransactionsV2Opts,
) {
  return useQuery({
    queryKey: ['poolTransactionsV2', poolId, pool?.chainId, opts],
    queryFn: async () => {
      const chainId = pool?.chainId as ChainId

      if (!pool || !isSushiSwapV2ChainId(chainId)) return []

      const txs = await getTransactions({
        id: poolId,
        type: opts.type,
      })

      const transformed = txs.map((tx) => ({
        ...tx,
        amountIn: Amount.fromRawAmount(pool.token0, tx.amount0),
        amountOut: Amount.fromRawAmount(pool.token1, tx.amount1),
      }))
      return transformed
    },
    enabled: !!pool && isSushiSwapV2ChainId(pool?.chainId as ChainId),
    refetchInterval: opts?.refetchInterval,
  })
}

type Transaction = NonNullable<
  ReturnType<typeof useTransactionsV2>['data']
>[number]

interface PoolTransactionsV2Props {
  pool: Pool
}

const PoolTransactionsV2: FC<PoolTransactionsV2Props> = ({ pool }) => {
  const [type, setType] = useState<
    Parameters<typeof useTransactionsV2>['2']['type']
  >(TransactionType.SWAPS)
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const COLUMNS = useMemo(() => {
    return [
      TX_SENDER_V2_COLUMN,
      TX_AMOUNT_IN_V2_COLUMN(type),
      TX_AMOUNT_OUT_V2_COLUMN(type),
      TX_AMOUNT_USD_V2_COLUMN,
      TX_CREATED_TIME_V2_COLUMN,
    ]
  }, [type])

  const opts = useMemo(
    () =>
      ({
        refetchInterval: 60_000,
        first:
          paginationState.pageSize === 0 ? paginationState.pageIndex + 1 : 100,
        type,
      }) as const,
    [paginationState.pageIndex, paginationState.pageSize, type],
  )
  const extendedPool = useExtendedPool({ pool })
  const { data, isLoading } = useTransactionsV2(extendedPool, pool.id, opts)

  const _data = useMemo(() => {
    return data ?? []
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col justify-between md:flex-row gap-y-4">
            Transactions
            <div className="flex items-center gap-1">
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionType.SWAPS}
                onClick={() => setType(TransactionType.SWAPS)}
              >
                Swaps
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionType.MINTS}
                onClick={() => setType(TransactionType.MINTS)}
              >
                Add
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionType.BURNS}
                onClick={() => setType(TransactionType.BURNS)}
              >
                Remove
              </Toggle>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="!px-0">
        <DataTable
          linkFormatter={(row) => Chain.from(row.chainId)!.getTxUrl(row.txHash)}
          loading={isLoading}
          columns={COLUMNS}
          data={_data}
          pagination={true}
          externalLink={true}
          onPaginationChange={setPaginationState}
          state={{
            pagination: paginationState,
          }}
        />
      </CardContent>
    </Card>
  )
}

export { PoolTransactionsV2, useTransactionsV2 }
export type { Transaction }
