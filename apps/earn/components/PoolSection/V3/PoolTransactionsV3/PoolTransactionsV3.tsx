import { Pool } from '@sushiswap/v3-sdk'
import { FC } from 'react'
import { Transaction, useTransactionsV3 } from './useTransactionsV3'
import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { AMOUNT_COLUMN, AMOUNT_USD_COLUMN, SENDER_COLUMN, TIME_COLUMN, TYPE_COLUMN } from './columns'
import { GenericTable } from '@sushiswap/ui/future/components/table/GenericTable'
import { Chain } from '@sushiswap/chain'

interface PoolTransactionsV3Props {
  pool: Pool | undefined
  poolId: string
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const COLUMNS = [TYPE_COLUMN, SENDER_COLUMN, AMOUNT_COLUMN, AMOUNT_USD_COLUMN, TIME_COLUMN]

export const PoolTransactionsV3: FC<PoolTransactionsV3Props> = ({ pool, poolId }) => {
  const { data, isLoading } = useTransactionsV3(pool, poolId)

  const table = useReactTable<Transaction>({
    data: data || [],
    columns: COLUMNS,
    pageCount: 1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="w-full">
      <GenericTable<Transaction>
        table={table}
        loading={true}
        pageSize={20}
        rowHeight={24}
        placeholder="No Transactions Found."
        linkFormatter={(row) => Chain.from(row.pool.chainId).getTxUrl(row.id)}
      />
    </div>
  )
}
