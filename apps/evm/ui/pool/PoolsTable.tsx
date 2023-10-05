'use client'

import { Slot } from '@radix-ui/react-slot'
import { SimplePool } from '@sushiswap/rockset-client'
import { Card, CardHeader, CardTitle, DataTable } from '@sushiswap/ui'
import { ColumnDef, PaginationState, Row, SortingState, TableState } from '@tanstack/react-table'
import { GetPoolsArgs, usePoolCount, usePools } from 'lib/hooks'
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react'

import { usePoolFilters } from './PoolsFiltersProvider'
import { APR_COLUMN_POOL, FEES_COLUMN, NAME_COLUMN_POOL, TVL_COLUMN, VOLUME_1D_COLUMN } from './columns'

const COLUMNS = [NAME_COLUMN_POOL, TVL_COLUMN, VOLUME_1D_COLUMN, FEES_COLUMN, APR_COLUMN_POOL] satisfies ColumnDef<
  SimplePool,
  unknown
>[]

interface PositionsTableProps {
  onRowClick?(row: SimplePool): void
}

export const PoolsTable: FC<PositionsTableProps> = ({ onRowClick }) => {
  const { chainIds, tokenSymbols, protocols, farmsOnly } = usePoolFilters()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'liquidityUSD', desc: true }])

  // const { data: poolCount } = usePoolCount({ args, shouldFetch: true, swrConfig: useSWRConfig() })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const state: Partial<TableState> = useMemo(() => {
    return {
      sorting,
      pagination,
    }
  }, [pagination, sorting])

  const args = useMemo<GetPoolsArgs>(() => {
    return {
      index: pagination.pageIndex,
      // chainIds: chainIds,
      // tokenSymbols,
      // isIncentivized: farmsOnly || undefined, // will filter farms out if set to false, undefined will be filtered out by the parser
      // isWhitelisted: true, // can be added to filters later, need to put it here so fallback works
      // orderBy: sorting[0]?.id,
      // orderDir: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
      // protocols,
    }
    // }, [chainIds, tokenSymbols, protocols, farmsOnly, sorting])
  }, [pagination])

  const { data: pools, isLoading: isValidatingPools } = usePools({ args })
  const { data: poolCount, isLoading: isValidatingCount } = usePoolCount({ args })

  const data = useMemo(() => pools?.flat() || [], [pools])

  const rowRenderer = useCallback(
    (row: Row<SimplePool>, rowNode: ReactNode) => {
      if (onRowClick)
        return (
          <Slot className="cursor-pointer" onClick={() => onRowClick?.(row.original)}>
            {rowNode}
          </Slot>
        )
      return rowNode
    },
    [onRowClick]
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Pools{' '}
            {poolCount?.count ? <span className="text-gray-400 dark:text-slate-500">({poolCount.count})</span> : null}
          </CardTitle>
        </CardHeader>
        <DataTable
          state={state}
          pagination={true}
          pageCount={poolCount ? Math.ceil(poolCount?.count / pagination.pageSize) : 0}
          onSortingChange={setSorting}
          onPaginationChange={setPagination}
          loading={!pools && isValidatingPools}
          linkFormatter={(row) => `/pool/${row.chainId}%3A${row.address}`}
          rowRenderer={rowRenderer}
          columns={COLUMNS}
          data={data}
        />
      </Card>
    </>
  )
}
