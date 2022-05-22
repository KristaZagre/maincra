import { Amount, Token } from '@sushiswap/currency'
import { Table, Typography } from '@sushiswap/ui'
import { createTable, getCoreRowModel, useTableInstance } from '@tanstack/react-table'
import { useRouter } from 'next/router'
import React, { FC, useEffect, useState } from 'react'
import { useNetwork } from 'wagmi'

import { RewardToken } from './context/RewardToken'
import InitialBidModal from './InitialBidModal'

interface AvailableAssetsTableProps {
  assets: RewardToken[]
  bidToken?: Amount<Token>
  placeholder: string
  loading: boolean
}

const table = createTable().setRowType<RewardToken>()

const defaultColumns = (tableProps: AvailableAssetsTableProps) => [
  table.createDataColumn('name', {
    header: () => <div className="w-full text-left">Asset</div>,
    cell: (props) => {
      return (
        <div className="w-full">
          <Typography variant="sm" weight={700} className="text-left text-slate-200">
            {props.getValue()}
          </Typography>
        </div>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'available size',
    header: () => <div className="w-full text-left">Available size</div>,
    cell: (props) => {
      const balance = props.row.original?.getTotalBalance() ?? undefined
      return (
        <Typography variant="sm" weight={700} className="text-left text-slate-200">
          {balance ? (balance.greaterThan('0') ? balance.toSignificant(6) : '< 0.01') : 'NA'}{' '}
          {` ${props.row.original?.symbol}`}
        </Typography>
      )
    },
  }),
  table.createDisplayColumn({
    id: 'action',
    header: () => <div className="w-full text-left">Action</div>,
    cell: (props) => {
      if (props.row.original) return <InitialBidModal bidToken={tableProps.bidToken} rewardToken={props.row.original} />
    },
  }),
]

export const AvailableAssetsTable: FC<AvailableAssetsTableProps> = (props) => {
  const { assets, placeholder, loading } = props

  const router = useRouter()
  const { activeChain } = useNetwork()
  const [initialized, setInitialized] = useState(loading)
  useEffect(() => {
    if (!loading) setInitialized(true)
  }, [loading])

  const [columns] = React.useState(() => [...defaultColumns(props)])

  const instance = useTableInstance(table, {
    data: assets ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table.container>
      <Table.table>
        <Table.thead>
          {instance.getHeaderGroups().map((headerGroup, i) => (
            <Table.thr key={headerGroup.id}>
              {!initialized && assets?.length === 0 ? (
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
              {!initialized && assets?.length === 0 ? (
                <Table.td colSpan={columns?.length} className="w-full text-center bg-slate-800/30">
                  {placeholder}
                </Table.td>
              ) : (
                <Table.td colSpan={columns?.length} className="text-center animate-pulse text-slate-500">
                  {placeholder}
                </Table.td>
              )}
            </Table.tr>
          )}
          {instance.getRowModel().rows?.map((row) => {
            return (
              <Table.tr key={row.id}>
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

export default AvailableAssetsTable
