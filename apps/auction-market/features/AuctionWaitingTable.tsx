// import { Amount, Token } from '@sushiswap/currency'
// import { Table, Typography } from '@sushiswap/ui'
// import { createTable, getCoreRowModel, useTableInstance } from '@tanstack/react-table'
// import { useRouter } from 'next/router'
// import React, { FC, useEffect, useState } from 'react'
// import { useNetwork } from 'wagmi'

// interface Props {
//   tokens: Amount<Token>[]
//   placeholder: string
//   loading: boolean
// }

// const table = createTable().setRowType<Amount<Token>>()

// const defaultColumns = (tableProps: Props) => [
//   table.createDataColumn('toExact', {
//     header: () => <div className="w-full text-right">Amount</div>,
//     cell: (props) => {
//       console.log(tableProps)
//       return (
//         <div className="flex flex-col w-full">
//           <Typography variant="sm" weight={700} className="text-right text-slate-200">
//             {props.getValue().greaterThan('0') ? props.getValue().toSignificant(6) : '< 0.01'}
//           </Typography>
//           <Typography variant="xs" weight={500} className="text-right text-slate-500">
//             {props.row.original?.token.symbol}
//           </Typography>
//         </div>
//       )
//     },
//   }),
//   // table.createDataColumn('type', {
//   //   header: () => <div className="w-full text-left">Type</div>,
//   //   cell: (props) => <div className="w-full text-left">{props.getValue()}</div>,
//   // }),
//   // table.createDisplayColumn({
//   //   id: 'from',
//   //   accessorFn: (props) => (tableProps.type === FuroTableType.INCOMING ? props.createdBy.id : props.recipient.id),
//   //   header: () => <div className="w-full text-left">From</div>,
//   //   cell: (props) => <div className="w-full text-left text-blue">{shortenAddress(props.getValue() as string)}</div>,
//   // }),
// ]
//   // console.log(defaultColumn)
// export const AuctionWaitingTable: FC<Props> = (props) => {
//   const { tokens, placeholder, loading } = props
//   const [initialized, setInitialized] = useState(loading)
//   useEffect(() => {
//     if (!loading) setInitialized(true)
//   }, [loading])
//   // const router = useRouter()
//   // const { activeChain } = useNetwork()
//   // const data = useMemo(
//   //   () =>
//   //     tokens?.map((token) => new Stream({ stream })).concat(vestings?.map((vesting) => new Vesting({ vesting }))) ??
//   //     [],
//   //   [streams, vestings],
//   // )

//   const [columns] = React.useState<typeof defaultColumns>(() => [...defaultColumns(props)])
//   const instance = useTableInstance(table, {
//     tokens,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   })

//   return (
//     <Table.container>
//       <Table.table>
//         <Table.thead>
//           {instance.getHeaderGroups().map((headerGroup, i) => (
//             <Table.thr key={headerGroup.id}>
//               {initialized && tokens.length === 0 ? (
//                 <th colSpan={headerGroup.headers?.length} className="border-b border-slate-800">
//                   <div className="w-full h-12 animate-pulse bg-slate-800/30" />
//                 </th>
//               ) : (
//                 headerGroup.headers.map((header, i) => (
//                   <Table.th key={header.id} colSpan={header.colSpan}>
//                     {header.renderHeader()}
//                   </Table.th>
//                 ))
//               )}
//             </Table.thr>
//           ))}
//         </Table.thead>
//         <Table.tbody>
//           {instance.getRowModel().rows.length === 0 && (
//             <Table.tr>
//               {initialized && tokens.length === 0 ? (
//                 <td colSpan={columns?.length}>
//                   <div className="w-full h-12 animate-pulse bg-slate-800/30" />
//                 </td>
//               ) : (
//                 <Table.td colSpan={columns?.length} className="text-center text-slate-500">
//                   {placeholder}
//                 </Table.td>
//               )}
//             </Table.tr>
//           )}
//           {instance.getRowModel()?.rows?.map((row) => {
//             return (
//               <Table.tr
//                 key={row.id}
//                 // onClick={() =>
//                 //   router.push({
//                 //     pathname: `/${row.original?.type.toLowerCase()}/${row.original?.id}`,
//                 //     query: { chainId: activeChain?.id },
//                 //   })
//                 // }
//               >
//                 {row.getVisibleCells().map((cell) => {
//                   return <Table.td key={cell.id}>{cell.renderCell()}</Table.td>
//                 })}
//               </Table.tr>
//             )
//           })}
//         </Table.tbody>
//       </Table.table>
//     </Table.container>
//   )
// }

// export default AuctionWaitingTable
