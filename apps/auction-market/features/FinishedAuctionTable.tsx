import { shortenAddress } from '@sushiswap/format'
import { useIsMounted } from '@sushiswap/hooks'
import { Table, Typography } from '@sushiswap/ui'
import { createTable, getCoreRowModel, useTableInstance } from '@tanstack/react-table'
import { useRouter } from 'next/router'
import React, { FC, useEffect, useState } from 'react'
import { useNetwork } from 'wagmi'

import { Auction } from './context/Auction'

interface FinishedAuctionTableProps {
  auctions: Auction[] | undefined
  placeholder: string
  loading: boolean
}

const table = createTable().setRowType<Auction>()

const defaultColumns = (tableProps: FinishedAuctionTableProps) => [
  table.createDataColumn('endDate', {
    header: () => <div className="w-full text-left">Date</div>,
    cell: (props) => {
      return (
        <div className="w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {props.getValue().toISOString().slice(0, 10)}
          </Typography>
        </div>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'asset',
    header: () => <div className="w-full text-left">Asset</div>,
    cell: (props) => (
      <div className="flex flex-col w-full">
        <Typography variant="sm" weight={700} className="text-left text-slate-200">
          {props.row.original?.rewardAmount.currency.name}
        </Typography>
      </div>
    ),
  }),
  table.createDataColumn('rewardAmount', {
    header: () => <div className="w-full text-left">Auction size</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {props.getValue().greaterThan('0') ? props.getValue().toSignificant(6) : '< 0.01'}{' '}
            {props.getValue().currency.symbol}
          </Typography>
        </div>
      )
    },
  }),
  table.createDataColumn('bidAmount', {
    header: () => <div className="w-full text-left">Settlement</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {props.getValue().greaterThan('0') ? props.getValue().toSignificant(6) : '< 0.01'}{' '}
            {props.getValue().currency.symbol}
          </Typography>
        </div>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'settle price',
    header: () => <div className="w-full text-left">Settle Price</div>,
    cell: (props) => <div className="w-full text-left ">TODO</div>,
  }),
  table.createDataColumn('leadingBid', {
    header: () => <div className="w-full text-left">Buyer</div>,
    cell: (props) => {
      const address = props.getValue()?.user.id ?? undefined
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {address ? shortenAddress(address) : 'Unknown'}
          </Typography>
        </div>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'action',
    header: () => <div className="w-full text-left">Action</div>,
    cell: (props) => <div className="w-full text-left">View on Etherscan</div>,
  }),
]

export const FinishedAuctionTable: FC<FinishedAuctionTableProps> = (props) => {
  const { auctions, placeholder, loading } = props

  const router = useRouter()
  const { activeChain } = useNetwork()
  const [initialized, setInitialized] = useState(loading)
  useEffect(() => {
    if (!loading) setInitialized(true)
  }, [loading])

  const [columns] = React.useState(() => [...defaultColumns(props)])

  const instance = useTableInstance(table, {
    data: auctions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isMounted = useIsMounted()
  if (!isMounted) return null

  return (
    <Table.container>
      <Table.table>
        <Table.thead>
          {instance.getHeaderGroups().map((headerGroup, i) => (
            <Table.thr key={headerGroup.id}>
              {initialized && auctions?.length === 0 ? (
                <th colSpan={headerGroup.headers?.length} className="border-b border-slate-800">
                  <div className="w-full bg-slate-800/30" />
                </th>
              ) : (
                headerGroup.headers.map((header, i) => (
                  <Table.th key={header.id + i} colSpan={header.colSpan}>
                    {header.renderHeader()}
                  </Table.th>
                ))
              )}
            </Table.thr>
          ))}
        </Table.thead>
        <Table.tbody>
          {instance.getRowModel().rows.length === 0 && (
            <Table.tr>
              {initialized && auctions?.length === 0 ? (
                <Table.td colSpan={columns?.length} className="w-full text-center animate-pulse bg-slate-800/30">
                  {placeholder}
                </Table.td>
              ) : (
                <Table.td colSpan={columns?.length} className="text-center text-slate-500">
                  {placeholder}
                </Table.td>
              )}
            </Table.tr>
          )}
          {instance.getRowModel().rows?.map((row) => {
            return (
              <Table.tr
                key={row.id}
                onClick={() =>
                  router.push({
                    pathname: `/auction/${row.original?.id}`,
                    query: { chainId: activeChain?.id },
                  })
                }
              >
                {row.getVisibleCells().map((cell) => {
                  return <Table.td key={cell.id}>{cell.renderCell()}</Table.td>
                })}
              </Table.tr>
            )
          })}
        </Table.tbody>
      </Table.table>
    </Table.container>
  )
}

export default FinishedAuctionTable
