'use client'

import { Chain, ChainId } from '@sushiswap/chain'
import { Pool, Transaction as _Transaction } from '@sushiswap/rockset-client'
import { Card, CardContent, CardHeader, CardTitle, DataTable } from '@sushiswap/ui'
import { Toggle } from '@sushiswap/ui/components/toggle'
import { isSushiSwapV3ChainId } from '@sushiswap/v3-sdk'
import { useQuery } from '@tanstack/react-query'
import { PaginationState } from '@tanstack/react-table'
import { FC, useMemo, useState } from 'react'

import {
  TX_AMOUNT_IN_V3_COLUMN,
  TX_AMOUNT_OUT_V3_COLUMN,
  TX_AMOUNT_USD_V3_COLUMN,
  TX_ORIGIN_V3_COLUMN,
  TX_TIME_V3_COLUMN,
} from './columns'
import { Amount } from '@sushiswap/currency'
import { ExtendedPool } from 'lib/hooks/api/useFlairPoolGraphData'

export enum TransactionTypeV3 {
  Mint = 'Mint',
  Burn = 'Burn',
  Swap = 'Swap',
  Collect = 'Collect',
}

interface UseTransactionsV3Opts {
  type: TransactionTypeV3
  refetchInterval?: number
  first: number
  skip?: number
}


// Will only support the last 1k txs
// The fact that there are different subtransactions aggregated under one transaction makes paging a bit difficult
function useTransactionsV3(pool: ExtendedPool, poolId: string, opts: UseTransactionsV3Opts) {
  return useQuery({
    queryKey: ['poolTransactionsV2', poolId, pool?.chainId, opts],
    queryFn: async () => {
      const chainId = pool?.chainId as ChainId

      if (!pool || !isSushiSwapV3ChainId(chainId)) return []

      const txs = await fetch(`/pool/api/v1/pool/${chainId}/${pool.address}/transactions/${opts.type.toLowerCase()}s`).then((data) => data.json()) as _Transaction[]
      
      const transformed = txs.map((tx) => ({
        ...tx,
        amountIn: !tx.amount0.startsWith('-') ? Amount.fromRawAmount(pool.token0, tx.amount0) : Amount.fromRawAmount(pool.token0, tx.amount0).multiply(-1),
        amountOut: !tx.amount1.startsWith('-') ? Amount.fromRawAmount(pool.token1, tx.amount1) : Amount.fromRawAmount(pool.token1, tx.amount1).multiply(-1),
      }))
      return transformed

    },
    enabled: !!pool && isSushiSwapV3ChainId(pool?.chainId as ChainId),
    refetchInterval: opts?.refetchInterval,
  })
}

type TransactionV3 = NonNullable<ReturnType<typeof useTransactionsV3>['data']>[0]

interface PoolTransactionsV3Props {
  pool: ExtendedPool
  poolId: string
}

const PoolTransactionsV3: FC<PoolTransactionsV3Props> = ({ pool, poolId }) => {
  const [type, setType] = useState<Parameters<typeof useTransactionsV3>['2']['type']>(TransactionTypeV3.Swap)
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const COLUMNS = useMemo(() => {
    return [
      TX_ORIGIN_V3_COLUMN,
      TX_AMOUNT_IN_V3_COLUMN(type),
      TX_AMOUNT_OUT_V3_COLUMN(type),
      TX_AMOUNT_USD_V3_COLUMN,
      TX_TIME_V3_COLUMN,
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

  const { data, isLoading } = useTransactionsV3(pool, poolId, opts)

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
                pressed={type === TransactionTypeV3.Swap}
                onClick={() => setType(TransactionTypeV3.Swap)}
              >
                Swaps
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionTypeV3.Mint}
                onClick={() => setType(TransactionTypeV3.Mint)}
              >
                Add
              </Toggle>
              <Toggle
                variant="outline"
                size="xs"
                pressed={type === TransactionTypeV3.Burn}
                onClick={() => setType(TransactionTypeV3.Burn)}
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

export { PoolTransactionsV3, useTransactionsV3 }
export type { TransactionV3 }

