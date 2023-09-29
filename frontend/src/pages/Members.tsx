import { SortingState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { MemberQuickAddButton } from "../components/MemberQuickAdd"
import { Member } from "../models/Member"
import { useEffect, useState } from "react"
import { fetchMembers } from "../services/members"
import { useNavigate } from "react-router"
import MemberBadge from '../components/MemberBadge'

const columnHelper = createColumnHelper<Member>()

const columns = [
    columnHelper.accessor(r => r.name, {
        id: 'name',
        header: 'Name',
        cell: info => info.getValue(),
    }),
    columnHelper.accessor(r => r.email, {
        'id': 'email',
        header: 'Email',
        cell: info => info.getValue(),
    }),
    columnHelper.accessor('membership', {
        header: 'Type',
        cell: ({ row }) =>
            <div className="memberRowHeader">
                <span className="memberLicence"><MemberBadge member={row.original} /></span>
            </div>
        ,
    })
]

function Members() {
    const navigate = useNavigate()
    const [data, setData] = useState<Member[]>([])
    const [loaded, setLoaded] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
    const [globalFilter, setGlobalFilter] = useState('')

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
    })

    useEffect(() => {
        fetchMembers().then((d) => {
            setData(d)
            setLoaded(true)
        })
    }, [])

    return (
        <>
            <h1>Members</h1>
            <div className="rounded-3 bg-white p-3 text-dark fullTable" id="copy">
                <div className="tableActions">
                    <MemberQuickAddButton courses={[]} onChange={() => fetchMembers().then(setData)} />
                    <div className='ps-2'>
                        <input type="text" className="form-control" placeholder="Search" onChange={(e) => setGlobalFilter(String(e.target.value))} />
                    </div>
                </div>
                <div id="tblStudents" className={"tableWrapper " + (!loaded ? "loading" : "")}>
                    <table className="table table-hover">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th className={`sortableHeader ${header.column.getIsSorted() === false ? '' : `sorting sort-${header.column.getIsSorted() as string}`}`} key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div onClick={header.column.getToggleSortingHandler()}>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>
                                            )}
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
                    {data.length === 0 ? (
                        <div className="tableError">
                            <p>No members found</p>
                        </div>
                    ) : ''}
                </div>
            </div>
        </>
    )
}

export default Members
