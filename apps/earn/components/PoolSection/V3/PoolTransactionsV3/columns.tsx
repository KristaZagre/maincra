import { ColumnDef } from '@tanstack/react-table'
import { Transaction, TransactionType } from './useTransactionsV3'
import { formatUSD } from '@sushiswap/format'
import formatDistance from 'date-fns/formatDistance/index.js'
import { Skeleton } from '@sushiswap/ui'

export const TYPE_COLUMN: ColumnDef<Transaction, unknown> = {
  id: 'type',
  header: 'Type',
  cell: (props) => <div className="text-sm">{TransactionType[props.row.original.type]}</div>,
  meta: {
    skeleton: (
      <div className="flex items-center w-full gap-2">
        <Skeleton.Box />
      </div>
    ),
  },
}

export const SENDER_COLUMN: ColumnDef<Transaction, unknown> = {
  id: 'sender',
  header: 'Sender',
  cell: (props) => (
    <div className="text-sm">{`${props.row.original.origin.slice(0, 6)}..${props.row.original.origin.slice(-4)}`}</div>
  ),
}

export const AMOUNT_COLUMN: ColumnDef<Transaction, unknown> = {
  id: 'amounts',
  header: 'Amounts',
  cell: (props) => {
    const row = props.row.original

    switch (row.type) {
      case TransactionType.Swap: {
        const amounts = row.amount0 < 0 ? [row.amount0, row.amount1] : [row.amount1, row.amount0]
        const tokens = row.amount0 < 0 ? [row.pool.token0, row.pool.token1] : [row.pool.token1, row.pool.token0]

        return (
          <div className="grid grid-flow-col grid-cols-7 items-center text-[10px] w-4/5">
            <div className="flex flex-col items-center col-span-3">
              <div className="flex">{Math.abs(amounts[0]).toFixed(2)}</div>
              <div className="flex">{tokens[0].symbol}</div>
            </div>
            <div className="flex justify-end">{`->`}</div>
            <div className="flex items-center justify-end col-span-3">
              <div className="flex flex-col">
                <div className="flex justify-center">{amounts[1].toFixed(2)}</div>
                <div className="flex justify-center">{tokens[1].symbol}</div>
              </div>
            </div>
          </div>
        )
      }
      case TransactionType.Mint:
      case TransactionType.Burn:
      case TransactionType.Collect:
        return (
          <div className="grid grid-flow-col grid-cols-7 items-center text-[10px] w-4/5">
            <div className="flex flex-col items-center col-span-3">
              <div className="flex">{row.amount0.toFixed(2)}</div>
              <div className="flex">{row.pool.token0.symbol}</div>
            </div>
            <div className="flex justify-end text-sm">{`+`}</div>
            <div className="flex items-center justify-end col-span-3">
              <div className="flex flex-col">
                <div className="flex justify-center">{row.amount1.toFixed(2)}</div>
                <div className="flex justify-center">{row.pool.token1.symbol}</div>
              </div>
            </div>
          </div>
        )
    }
  },
  meta: {
    className: 'justify-end',
    skeleton: (
      <div className="flex items-center w-full gap-2">
        <div className="flex items-center">
          <Skeleton.Circle radius={16} />
          <Skeleton.Circle radius={16} className="-ml-[12px]" />
        </div>
        <div className="flex flex-col w-full">
          <Skeleton.Box />
        </div>
      </div>
    ),
  },
}

export const AMOUNT_USD_COLUMN: ColumnDef<Transaction, unknown> = {
  id: 'amountUSD',
  header: 'Amount (USD)',
  cell: (props) => <div className="text-sm">{formatUSD(props.row.original.amountUSD)}</div>,
  meta: {
    className: 'justify-end',
  },
}

export const TIME_COLUMN: ColumnDef<Transaction, unknown> = {
  id: 'time',
  header: 'Time',
  cell: (props) => (
    <div className="flex justify-end w-full text-sm">
      {formatDistance(props.row.original.timestamp * 1000, new Date(), { addSuffix: true })}
    </div>
  ),
  meta: {
    className: 'justify-end',
    // skeleton: (
    //   <div className="flex items-center w-full gap-2">
    //     <div className="flex items-center">
    //       <Skeleton.Circle radius={ICON_SIZE} />
    //       <Skeleton.Circle radius={ICON_SIZE} className="-ml-[12px]" />
    //     </div>
    //     <div className="flex flex-col w-full">
    //       <Skeleton.Text fontSize="text-lg" />
    //     </div>
    //   </div>
    // ),
  },
}
