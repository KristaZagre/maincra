'use client'

import { Chain, ChainId } from '@sushiswap/chain'
import { Amount, Token } from '@sushiswap/currency'
import { Pool, Transaction as _Transaction } from '@sushiswap/rockset-client'
import { Card, CardContent, CardHeader, CardTitle, DataTable } from '@sushiswap/ui'
import { Toggle } from '@sushiswap/ui/components/toggle'
import { isSushiSwapV2ChainId } from '@sushiswap/v2-sdk'
import { useQuery } from '@tanstack/react-query'
import { PaginationState } from '@tanstack/react-table'
import { ExtendedPool, useExtendedPool } from 'lib/hooks/api/useFlairPoolGraphData'
import { FC, useMemo, useState } from 'react'

import {
  TX_AMOUNT_IN_V2_COLUMN,
  TX_AMOUNT_OUT_V2_COLUMN,
  TX_AMOUNT_USD_V2_COLUMN,
  TX_CREATED_TIME_V2_COLUMN,
  TX_SENDER_V2_COLUMN,
} from './columns'

export enum TransactionType {
  Mint = 'Mint',
  Burn = 'Burn',
  Swap = 'Swap',
}

interface UseTransactionsV2Opts {
  type: TransactionType
  refetchInterval?: number
  first: number
  skip?: number
}


// Will only support the last 1k txs
// The fact that there are different subtransactions aggregated under one transaction makes paging a bit difficult
function useTransactionsV2(pool: ExtendedPool, poolId: string, opts: UseTransactionsV2Opts) {
  return useQuery({
    queryKey: ['poolTransactionsV2', poolId, pool?.chainId, opts],
    queryFn: async () => {
      const chainId = pool?.chainId as ChainId

      if (!pool || !isSushiSwapV2ChainId(chainId)) return []

      const txs = await fetch(`/pool/api/v1/pools/${chainId}/${pool.address}/transactions/${opts.type.toLowerCase()}s`).then((data) => data.json()) as _Transaction[]
      
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

type Transaction = _Transaction & {
  amountIn: Amount<Token>,
  amountOut: Amount<Token>
}

interface PoolTransactionsV2Props {
  pool: Pool
  poolId: string
}

const PoolTransactionsV2: FC<PoolTransactionsV2Props> = ({ pool, poolId }) => {
  const [type, setType] = useState<Parameters<typeof useTransactionsV2>['2']['type']>(TransactionType.Swap)
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
        first: paginationState.pageSize === 0 ? paginationState.pageIndex + 1 : 100,
        type,
      } as const),
    [paginationState.pageIndex, paginationState.pageSize, type]
  )
  const extendedPool = useExtendedPool({ pool })
  const { data, isLoading } = useTransactionsV2(extendedPool, poolId, opts)

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
                pressed={type === TransactionType.Swap}
                onClick={() => setType(TransactionType.Swap)}
              >
                Swaps
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionType.Mint}
                onClick={() => setType(TransactionType.Mint)}
              >
                Add
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionType.Burn}
                onClick={() => setType(TransactionType.Burn)}
              >
                Remove
              </Toggle>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="!px-0">
        <DataTable
          linkFormatter={(row) => Chain.from(row.chainId).getTxUrl(row.txHash)}
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

