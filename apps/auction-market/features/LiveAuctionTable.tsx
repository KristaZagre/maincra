import { Amount, Token } from '@sushiswap/currency'
import { Table, Typography } from '@sushiswap/ui'
import { createTable, getCoreRowModel, useTableInstance } from '@tanstack/react-table'
import { useRouter } from 'next/router'
import React, { FC, useEffect, useState } from 'react'
import { useNetwork } from 'wagmi'

import BidModal from './BidModal'
import { Auction } from './context/Auction'

interface LiveAuctionTableProps {
  auctions: Auction[] | undefined
  bidToken?: Amount<Token>
  placeholder: string
  loading: boolean
}

const table = createTable().setRowType<Auction>()

const defaultColumns = (tableProps: LiveAuctionTableProps) => [
  table.createDataColumn('rewardAmount', {
    header: () => <div className="w-full text-left">Asset</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {props.getValue().currency.name}
          </Typography>
        </div>
      )
    },
  }),

  table.createDataColumn('rewardAmount', {
    header: () => <div className="w-full text-left">Auction size</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
          {props.getValue().greaterThan('0') ? props.getValue().toSignificant(6) : '< 0.01'} {props.getValue().currency.symbol}
          </Typography>
        </div>
      )
    },
  }),

  table.createDataColumn('bidAmount', {
    header: () => <div className="w-full text-left">Current bid</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
          {props.getValue().greaterThan('0') ? props.getValue().toSignificant(6) : '< 0.01'} {props.getValue().currency.symbol}
          </Typography>
        </div>
      )
    },
  }),

  table.createDataColumn('id', {
    header: () => <div className="w-full text-left">Market Price</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
          TODO
          </Typography>
        </div>
      )
    },
  }),
  table.createDataColumn('id', {
    header: () => <div className="w-full text-left">Profit</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
          TODO
          </Typography>
        </div>
      )
    },
  }),
  table.createDataColumn('remainingTime', {
    header: () => <div className="w-full text-left">Progress</div>,
    cell: (props) => {
      return (
        <div className="flex flex-col w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200 font-weight-900">
          {`${props.cell.getValue()?.hours}H ${props.cell.getValue()?.minutes}M  ${props.cell.getValue()?.seconds}S `}
          </Typography>
        </div>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'action',
    header: () => <div className="w-full text-left">Bid</div>,
    cell: (props) => <BidModal bidToken={tableProps.bidToken} auction={props.row.original}/>,
  }),
]

export const LiveAuctionTable: FC<LiveAuctionTableProps> = (props) => {
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
    getCoreRowModel: getCoreRowModel()
  })


  return (
    <Table.container>
      <Table.table>
        <Table.thead>
          {instance.getHeaderGroups().map((headerGroup, i) => (
            <Table.thr key={headerGroup.id}>
              {!initialized && auctions?.length === 0 ? (
                <th colSpan={headerGroup.headers?.length} className="border-b border-slate-800">
                  <div className="w-full bg-slate-800/30"/>
                </th>
              ) : (
                headerGroup.headers.map((header, i) => (
                  <Table.th key={header.id} colSpan={header.colSpan}>
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
              {!initialized && auctions?.length === 0 ? (
                <td colSpan={columns?.length}>
                  <div className="w-full animate-pulse bg-slate-800/30" />
                </td>
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
                // onClick={() =>
                //   router.push({
                //     pathname: `/auction/${row.original?.id}`,
                //     query: { chainId: activeChain?.id },
                //   })
                // } // TODO: temporarily disabled, otherwise it routes to page when clicking on Bid button
              >
                {row.getVisibleCells().map((cell) => {
                  return <Table.td key={cell.id} onClick={() => {}}>{cell.renderCell()}</Table.td>
                })}
              </Table.tr>
            )
          })}
        </Table.tbody>
      </Table.table>
    </Table.container>
  )
}

export default LiveAuctionTable
