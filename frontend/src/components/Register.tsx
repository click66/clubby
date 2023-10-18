import '../assets/Register.component.scss'

import { RowData, SortingState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { notifyError, notifySuccess } from '../utils/notifications'
import { MemberQuickAddButton } from './MemberQuickAdd'
import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from 'react-bootstrap'
import { ArrowClockwise, Cash } from 'react-bootstrap-icons'
import MemberBadge from './MemberBadge'
import { DomainError } from '../errors'
import { renderLogAttendanceModal } from './LogAttendanceModal'
import EscapeLink from './EscapeLink'
import { Attendance, Attendee } from '../domain/attendance/types'
import { attendanceApi } from '../domain/attendance/provider'
import coursesApi from '../domain/courses/provider'
import { membersApi } from '../domain/members/provider'
import { Course } from '../domain/courses/types'

interface RegisterProps {
    courses: Course[]
    squashDates: boolean
}

interface SessionCourse {
    uuid: string
    label: string
}

type Session = {
    courses: SessionCourse[],
    date: Date,
}

type MemberCourseAttendance = Map<string, Map<string, Attendance>>
type RegisterMap = Map<string, MemberCourseAttendance>

interface AddAttendanceArgs {
    attendee: Attendee,
    session: Session,
    resolution: 'comp' | 'paid' | null,
    paymentOption: 'advance' | 'now',
    replace?: boolean,
}

interface RemoveAttendanceArgs {
    attendee: Attendee,
    session: Session
}

interface RegisterCellProps {
    attendance: Attendance | null,
    attendee: Attendee,
    session: Session,
    addAttendance: (props: AddAttendanceArgs) => Promise<void>,
    removeAttendance: (props: RemoveAttendanceArgs) => Promise<void>,
}

interface RegisterRowProps {
    attendance: MemberCourseAttendance | null,
    attendee: Attendee
    sessions: Session[],
    addAttendance: (props: AddAttendanceArgs) => Promise<void>,
    removeAttendance: (props: RemoveAttendanceArgs) => Promise<void>,
}

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        courses: Course[],
        updateData: (member: Attendee) => void
    }
}

function generatePrevious30Dates(courses: Course[], squash: boolean): Session[] {
    const result: Session[] = []
    const currentDate = new Date()
    let daysCount = 0

    courses = courses.filter((c) => c.uuid != undefined)

    while (result.length < 30 && daysCount < 365) {
        const matchingCourses = courses.filter((c) => coursesApi.courseHappensOnDay(c, (currentDate.getDay() + 6) % 7))    // For some reason I didn't index Sunday as 0

        if (matchingCourses.length > 0) {
            if (squash) {
                result.push({ courses: matchingCourses, date: new Date(currentDate) })
            } else {
                matchingCourses.forEach((course) => result.push({
                    courses: [course],
                    date: new Date(currentDate)
                }))
            }
        }

        currentDate.setDate(currentDate.getDate() - 1)
        daysCount++
    }

    return result
}

const columnHelper = createColumnHelper<Attendee>()
const columns = [
    columnHelper.accessor(r => r.name, {
        id: 'name',
        header: 'Member',
        cell: ({ getValue, row, table }) => (
            <div className="memberRowHeader">
                <span className="memberName">{getValue()}</span>
                <span className="memberIcons">
                    {table.options.meta?.courses
                        .map((c: Course) => row.original.hasUsablePaymentForCourse(c as { uuid: string }))
                        .includes(true) ? <Cash /> : ''}
                    {table.options.meta?.courses
                        .map((c: Course) => row.original.hasSubscriptionForCourse(c as { uuid: string }, new Date()))
                        .includes(true) ? <ArrowClockwise /> : ''}
                </span>
            </div>
        ),
        sortDescFirst: false,
    }),
    columnHelper.accessor(r => r.hasLicence(), {
        header: 'Type',
        cell: ({ row }) => <span className="memberLicence"><MemberBadge member={row.original} /></span>,
        sortingFn: (a, b) => {
            const sortName = () => b.original.name.localeCompare(a.original.name)

            const memberA = a.original as Attendee
            const memberB = b.original as Attendee
            const hasLicenceA = memberA.hasLicence()
            const hasLicenceB = memberB.hasLicence()
            const isActiveTrialA = memberA.activeTrial()
            const isActiveTrialB = memberB.activeTrial()
            const currentDate = new Date()

            if (hasLicenceA && !hasLicenceB) return 1
            if (hasLicenceB && !hasLicenceA) return -1

            if (!hasLicenceA && !hasLicenceB) {
                if (isActiveTrialA && !isActiveTrialB) return 1
                if (isActiveTrialB && !isActiveTrialA) return -1
            }

            if (hasLicenceA && hasLicenceB) {
                if (memberA.isLicenceExpired(currentDate) && !memberB.isLicenceExpired(currentDate)) return -1
                if (memberB.isLicenceExpired(currentDate) && !memberA.isLicenceExpired(currentDate)) return 1
            }

            return sortName()
        },
        sortDescFirst: true,
    })
]

const MemberDetails = ({ member }: { member: Attendee }) => (
    <div>
        <ul className="details">
            {
                member.activeTrial() ?
                    <>
                        <li>
                            <label>Remaining Trial Sessions:</label>&nbsp;{member.remainingTrialSessions}
                        </li>
                        <li>&nbsp;</li>
                    </> : ''
            }
            {
                member.hasLicence() ?
                    <>
                        <li>
                            <label>Licence No.:</label>&nbsp;{member.licenceNo}
                        </li>
                        <li>
                            <label>Licence Expires:</label>&nbsp;{member.licenceExpiry?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </li>
                    </> : ''
            }
            <li><EscapeLink to={`/members/${member.uuid}/profile`} state={{ member }}>Manage</EscapeLink></li>
        </ul>
    </div>
)

const isoDate = (date: Date) => date.toISOString().split('T')[0]

const AttendanceBadge = ({ attendance }: { attendance: Attendance | null }) => {
    if (!attendance) {
        return (<span>&nbsp;</span>)
    }

    switch (attendance.resolution) {
        case 'paid':
            return <Badge bg="primary">Paid</Badge>
        case 'comp':
            return <Badge bg="primary">Free</Badge>
        default:
            return <Badge bg="secondary">Attending</Badge>
    }
}

const RegisterCell = memo(({
    attendance,
    session,
    attendee,
    addAttendance,
    removeAttendance,
}: RegisterCellProps) => {
    const [selected, setSelected] = useState(false)
    const [loading, setLoading] = useState(false)
    const courses = session.courses.filter((c) => attendee.isInCourse(c))
    const disabled = courses.length === 0

    return (
        <td onClick={(e) => {
            if (!disabled) {
                setSelected(true)
                setTimeout(() => {
                    setSelected(false)
                }, 2000)
                renderLogAttendanceModal(e.target as Node, {
                    allowClearAttendance: attendance !== null,
                    attendee: attendee,
                    session: session,
                    addAttendance: (props) => {
                        setLoading(true)
                        addAttendance({ ...props, replace: attendance !== null }).finally(() => setLoading(false))
                    },
                    removeAttendance: (props) => {
                        setLoading(true)
                        removeAttendance(props).finally(() => setLoading(false))
                    },
                })
            }
        }} className={'registerCell ' + (disabled ? 'disabled ' : ' ') + (selected ? 'selected ' : ' ') + (loading ? 'loading ' : ' ')}>
            <AttendanceBadge attendance={attendance} />
        </td>
    )
})

const RegisterRow = ({ sessions = [], attendance, attendee, addAttendance, removeAttendance }: RegisterRowProps) => (
    <>
        {sessions.map((s, i) => (
            <RegisterCell
                key={i}
                attendance={s.courses.reduce(
                    (acc, course: SessionCourse) => acc ?? (attendance?.get(course.uuid)?.get(isoDate(s.date)) ?? null),
                    null as Attendance | null,
                )}
                attendee={attendee}
                session={s}
                addAttendance={addAttendance}
                removeAttendance={removeAttendance}
            />
        ))}
    </>
)

const Register = ({ courses = [], squashDates }: RegisterProps) => {
    const registerData = useRef<RegisterMap>(new Map())

    const [dates, setDates] = useState<Session[]>([])
    const [members, setMembers] = useState<Attendee[]>([])
    const [loaded, setLoaded] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
    const [globalFilter, setGlobalFilter] = useState('')

    const table = useReactTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {
            courses,
            updateData: (attendee: Attendee) => {
                setMembers((old) => {
                    const index = old.findIndex((row) => row.uuid === attendee.uuid)
                    return index !== -1 ? [...old.slice(0, index), attendee, ...old.slice(index + 1)] : [...old, attendee]
                })
            }
        },
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
    })

    const lookupMemberAttendance = (member: Attendee) => registerData.current.get(member.uuid) ?? null

    const storeAttendance = (data: Attendance[]) => data.reduce((acc: RegisterMap, attendance: Attendance) => {
        const memberUuid = attendance.attendee.uuid
        const date = attendance.session.date

        acc.set(memberUuid, acc.get(memberUuid) || new Map())
        attendance.session.courses.forEach((course) => {
            acc.get(memberUuid)!.set(course.uuid, acc.get(memberUuid)!.get(course.uuid) || new Map())
            acc.get(memberUuid)!.get(course.uuid)!.set(isoDate(date), attendance)
        })
        return acc
    }, registerData.current)

    const purgeAttendance = (member: Attendee, session: Session) => session.courses.reduce((acc: RegisterMap, c: SessionCourse) => {
        acc.get(member.uuid)?.get(c.uuid)?.delete(isoDate(session.date))
        return acc
    }, registerData.current)

    const addAttendanceAndPropagate = useCallback((props: AddAttendanceArgs): Promise<void> => {
        return attendanceApi.attendSession(props)
            .then((attendance: Attendance) => {
                table.options.meta?.updateData(attendance.attendee)
                storeAttendance([attendance])
                notifySuccess('Attendance recorded')
            }).catch((e) => {
                if (e instanceof DomainError) {
                    return notifyError(e.message)
                }
                notifyError('Unable to connect to server; check your network connection or try again later')
            }) as Promise<void>
    }, [])

    const removeAttendanceAndPropagate = useCallback((props: RemoveAttendanceArgs): Promise<void> => {
        return attendanceApi.unattendSession(props)
            .then((attendee: Attendee) => {
                table.options.meta?.updateData(attendee)
                purgeAttendance(props.attendee, props.session)
                notifySuccess('Attendance cleared')
            }).catch((e) => {
                if (e instanceof DomainError) {
                    return notifyError(e.message)
                }
                notifyError('Unable to connect to server; check your network connection or try again later')
            }) as Promise<void>
    }, [])

    const fetchActiveAttendees = () => membersApi.getMembersByCourses({ courses }).then((members) => members.filter((m) => m.active)) as Promise<Attendee[]>

    useEffect(() => {
        fetchActiveAttendees().then((members) => {
            const dates = generatePrevious30Dates(courses, squashDates)
            setDates(dates)

            // Might be more efficient to have the attendance API read by course, then these can be performed in unison
            if (dates.length) {
                attendanceApi.getAttendance({
                    attendees: members,
                    courses,
                    dateEarliest: dates[dates.length - 1].date,
                    dateLatest: dates[0].date,
                })
                    .then(storeAttendance)
                    .then(() => {
                        setMembers(members)
                        setLoaded(true)
                    })
            } else {
                setLoaded(true)
            }
        })
    }, [courses])

    return (
        <>
            <div className="tableActions">
                <MemberQuickAddButton courses={courses} onChange={(newMember) => table.options.meta?.updateData(newMember)} />
                <div className="ps-2">
                    <input type="text" className="form-control" placeholder="Search" onChange={(e) => setGlobalFilter(String(e.target.value))} />
                </div>
            </div>
            <div className={"tblRegister tableWrapper " + (!loaded ? "loading" : "")}>
                <div className="tblRegisterInner">
                    <table>
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
                                    {
                                        dates.map((date: Session, i) => (
                                            <th key={i}>{isoDate(date.date)}</th>
                                        ))
                                    }
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <Fragment key={row.id}>
                                    <tr>
                                        {row.getVisibleCells().map((cell) => (
                                            <th key={cell.id} onClick={() => { row.toggleExpanded() }}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </th>
                                        ))}
                                        <RegisterRow
                                            attendee={row.original}
                                            sessions={dates}
                                            attendance={lookupMemberAttendance(row.original)}
                                            addAttendance={addAttendanceAndPropagate}
                                            removeAttendance={removeAttendanceAndPropagate} />
                                    </tr>
                                    {row.getIsExpanded() && (
                                        <tr>
                                            <td colSpan={31} className="expanded">
                                                <MemberDetails member={row.original} />
                                            </td>
                                        </tr>
                                    )}
                                </ Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {members.length === 0 ? (
                    <div className="tableError">
                        <p>No members found</p>
                        <EscapeLink to="/members">Manage Members</EscapeLink>
                    </div>
                ) : ''}
            </div>
        </>
    )
}

export default Register
