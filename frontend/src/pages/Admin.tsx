import '../assets/Settings.page.scss'

import { useEffect, useState } from 'react'
import { getClubs } from '../domain/group-administration/service'
import { Club } from '../domain/group-administration/models'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

function ManageClubs() {
    const [data, setData] = useState<Club[]>([])

    const columnHelper = createColumnHelper<Club>()

    useEffect(() => {
        getClubs().then(setData)
    }, [])

    const columns = [
        columnHelper.accessor('name', {
            header: 'Name',
        }),
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <>
            <h1>Clubs</h1>
            <table className="table table-hover">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} onClick={() => { }}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default function Admin() {
    return (
        <div id="copy">
            <div className="settingsContainer">
                <ManageClubs />
            </div>
        </div>
    )
}
