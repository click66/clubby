import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { MemberQuickAddButton } from "../components/MemberQuickAdd"
import Member from "../models/Member"
import { useEffect, useState } from "react"
import { fetchMembers } from "../services/members"
import { useNavigate } from "react-router"

const columnHelper = createColumnHelper<Member>()

const columns = [
    columnHelper.accessor(r => r.name, {
        id: 'name',
        header: 'Name',
        cell: info => info.getValue(),
    }),
]

function Members() {
    const navigate = useNavigate()
    const [data, setData] = useState<Member[]>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    useEffect(() => {
        fetchMembers().then(setData)
    }, [])

    return (
        <>
            <h1>Members</h1>
            <div className="rounded-3 bg-white p-3 text-dark" id="copy">
                <div className="registerActions">
                    <MemberQuickAddButton courses={[]} />
                </div>
                <div id="tblStudents">
                    <table className="table table-hover">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} onClick={() => navigate(`/members/${row.original.uuid}/profile`, { state: { member: row.original } })}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default Members
