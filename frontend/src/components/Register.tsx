import '../assets/Register.component.scss'

import { RowData, SortingState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Member } from '../models/Member'
import { fetchMembersByCourses } from '../services/members'
import { notifyError, notifySuccess } from '../utils/notifications'
import { MemberQuickAddButton } from './MemberQuickAdd'
import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react'
import { deleteAttendance, getMemberAttendances, logAttendance } from '../services/attendance'
import { Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { BoxArrowUpRight, Cash } from 'react-bootstrap-icons'
import MemberBadge from './MemberBadge'
import { DomainError } from '../errors'
import { renderLogAttendanceModal } from './LogAttendanceModal'
import Spinner from './Spinner'

interface Course {
    uuid: string
    label: string

    happensOnDay(dayNo: number): boolean
}

interface RegisterProps {
    courses: Course[]
    squashDates: boolean
}

interface CourseRegisterData {
    id: number
    courseUuid: string
    resolution: string
    studentUuid: string
    date: Date
}

interface SessionCourse {
    uuid: string
    label: string
}

type Session = {
    courses: SessionCourse[],
    date: Date,
}

type MemberCourseAttendance = Map<string, Map<string, CourseRegisterData>>
type RegisterMap = Map<string, MemberCourseAttendance>

interface AddAttendanceArgs {
    member: Member,
    session: Session,
    resolution: string,
    paymentOption: string,
}

interface RemoveAttendanceArgs {
    member: Member,
    session: Session
}

interface RegisterCellProps {
    attendance: CourseRegisterData | null,
    member: Member,
    session: Session,
    addAttendance: (props: AddAttendanceArgs) => Promise<void>,
    removeAttendance: (props: RemoveAttendanceArgs) => Promise<void>,
}

interface RegisterRowProps {
    attendance: MemberCourseAttendance | null,
    member: Member
    sessions: Session[],
    addAttendance: (props: AddAttendanceArgs) => Promise<void>,
    removeAttendance: (props: RemoveAttendanceArgs) => Promise<void>,
}

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        courses: Course[],
        updateData: (member: Member) => void
    }
}

function generatePrevious30Dates(courses: Course[], squash: boolean): Session[] {
    const result: Session[] = []
    const currentDate = new Date()
    let daysCount = 0

    courses = courses.filter((c) => c.uuid != undefined)

    while (result.length < 30 && daysCount < 365) {
        const matchingCourses = courses.filter((c) => c.happensOnDay((currentDate.getDay() + 6) % 7))    // For some reason I didn't index Sunday as 0

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

const columnHelper = createColumnHelper<Member>()
const columns = [
    columnHelper.accessor(r => r.name, {
        id: 'name',
        header: 'Member',
        cell: ({ getValue, row, table }) => (
            <div className="memberRowHeader">
                <span className="memberName">{getValue()}</span>
                <span className="memberIcons">{table.options.meta?.courses
                    .map((c: Course) => row.original.hasUsablePaymentForCourse(c as { uuid: string }))
                    .includes(true) ? <Cash /> : ''}</span>
            </div>
        ),
    }),
    columnHelper.accessor('membership', {
        header: 'Type',
        cell: ({ row }) => <span className="memberLicence"><MemberBadge member={row.original} /></span>,
        sortingFn: (a, b) => {
            const memberA = a.original as Member
            const memberB = b.original as Member
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
                if (memberA.expired(currentDate)) return memberB.expired(currentDate) ? 0 : -1
                return 1
            }

            return 0
        }
    })
]

const MemberDetails = ({ member }: { member: Member }) => (
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
            <li><Link to={`/members/${member.uuid}/profile`} state={{ member }}><BoxArrowUpRight />&nbsp;Manage</Link></li>
        </ul>
    </div>
)

const isoDate = (date: Date) => date.toISOString().split('T')[0]

const AttendanceBadge = ({ attendance }: { attendance: CourseRegisterData | null }) => {
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
    member,
    addAttendance,
    removeAttendance,
}: RegisterCellProps) => {
    const [selected, setSelected] = useState(false)
    const [loading, setLoading] = useState(false)
    const courses = session.courses.filter((c) => member.isInCourse(c))
    const disabled = courses.length === 0

    return (
        <td onClick={(e) => {

            setSelected(true)
            setTimeout(() => {
                setSelected(false)
            }, 2000)
            renderLogAttendanceModal(e.target as Node, {
                allowClearAttendance: attendance !== null,
                member: member,
                session: session,
                addAttendance: (props) => {
                    setLoading(true)
                    addAttendance(props).finally(() => setLoading(false))
                },
                removeAttendance: (props) => {
                    setLoading(true)
                    removeAttendance(props).finally(() => setLoading(false))
                },
            })
        }} className={'registerCell ' + (disabled ? 'disabled ' : ' ') + (selected ? 'selected ' : ' ') + (loading ? 'loading ' : ' ')}>
            <AttendanceBadge attendance={attendance} />
        </td>
    )
})

const RegisterRow = ({ sessions = [], attendance, member, addAttendance, removeAttendance }: RegisterRowProps) => (
    <>
        {sessions.map((s, i) => (
            <RegisterCell
                key={i}
                attendance={s.courses.reduce(
                    (acc, course: SessionCourse) => acc ?? (attendance?.get(course.uuid)?.get(isoDate(s.date)) ?? null),
                    null as CourseRegisterData | null,
                )}
                member={member}
                session={s}
                addAttendance={addAttendance}
                removeAttendance={removeAttendance}
            />
        ))}
    </>
)

const addMemberAttendance = ({ member, session, resolution, paymentOption }: AddAttendanceArgs): Promise<Member> => {
    const courses = session.courses.filter((c) => member.isInCourse(c))
    const sessions = courses.map((c) => {
        return {
            ...session,
            payment: (resolution === 'paid' && paymentOption === 'advance' ? { courseUuid: c.uuid } : null),
        }
    })

    try {
        member.attendMultiple(sessions)
    } catch (e) {
        if (e instanceof DomainError) {
            return Promise.reject(e)
        }
    }

    return Promise.all(courses.reduce((acc: Promise<any>[], c: SessionCourse) => {
        let memberUuid = member.uuid,
            courseUuid = c.uuid

        acc.push(logAttendance({
            student_uuid: memberUuid,
            course_uuid: courseUuid,
            date: session.date,
            resolution: resolution === 'attending' ? null : resolution,
            paymentOption: paymentOption,
        }))

        return acc
    }, [] as Promise<any>[])).then((_) => {
        return member
    })
}

const removeMemberAttendance = ({ member, session }: RemoveAttendanceArgs) => Promise.all(session.courses.filter((c) => member.isInCourse(c)).reduce((acc: Promise<any>[], c: SessionCourse) => {
    member.unattend(session)

    let memberUuid = member.uuid,
        courseUuid = c.uuid

    acc.push(deleteAttendance({
        student_uuid: memberUuid,
        course_uuid: courseUuid,
        date: session.date,
    }))
    return acc
}, [] as Promise<any>[])).then(() => {
    return member
})

const Register = ({ courses = [], squashDates }: RegisterProps) => {
    const registerData = useRef<RegisterMap>(new Map())

    const [dates, setDates] = useState<Session[]>([])
    const [members, setMembers] = useState<Member[]>([])
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
            updateData: (member: Member) => {
                setMembers((old) => old.map((row) => row.uuid == member.uuid ? member : row))
            }
        },
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
    })

    const lookupMemberAttendance = (member: Member) => registerData.current.get(member.uuid) ?? null

    const storeAttendance = (data: CourseRegisterData[]) => data.reduce((acc: RegisterMap, d: CourseRegisterData) => {
        const { studentUuid, courseUuid, date } = d
        acc.set(studentUuid, acc.get(studentUuid) || new Map())
        acc.get(studentUuid)!.set(courseUuid, acc.get(studentUuid)!.get(courseUuid) || new Map())
        acc.get(studentUuid)!.get(courseUuid)!.set(isoDate(date), d)
        return acc
    }, registerData.current)

    const purgeAttendance = (member: Member, session: Session) => session.courses.reduce((acc: RegisterMap, c: SessionCourse) => {
        acc.get(member.uuid)?.get(c.uuid)?.delete(isoDate(session.date))
        return acc
    }, registerData.current)

    const addAttendanceAndPropagate = useCallback((props: AddAttendanceArgs): Promise<void> => {
        return addMemberAttendance(props).then((member: Member) => {
            table.options.meta?.updateData(member)
            storeAttendance([{
                id: 0,
                courseUuid: props.session.courses[0].uuid,
                resolution: props.resolution,
                studentUuid: member.uuid,
                date: props.session.date,
            }])
            notifySuccess('Attendance recorded')
        }).catch((e) => {
            if (e instanceof DomainError) {
                return notifyError(e.message)
            }
            notifyError('Unable to connect to server; check your network connection or try again later')
        }) as Promise<void>
    }, [])

    const removeAttendanceAndPropagate = useCallback((props: RemoveAttendanceArgs): Promise<void> => {
        return removeMemberAttendance(props).then((member: Member) => {
            table.options.meta?.updateData(member)
            purgeAttendance(props.member, props.session)
            notifySuccess('Attendance cleared')
        }).catch((e) => {
            if (e instanceof DomainError) {
                return notifyError(e.message)
            }
            notifyError('Unable to connect to server; check your network connection or try again later')
        }) as Promise<void>
    }, [])

    useEffect(() => {
        if (courses.length) {
            fetchMembersByCourses(courses).then((members) => {
                const dates = generatePrevious30Dates(courses, squashDates)
                setDates(dates)

                // Might be more efficient to have the attendance API read by course, then these can be performed in unison
                return getMemberAttendances({
                    members,
                    courses,
                    dateEarliest: dates[dates.length - 1].date,
                    dateLatest: dates[0].date,
                })
                    .then((data) => data.map((d) => {
                        return {
                            ...d,
                            studentUuid: d.member.uuid,
                            courseUuid: d.course.uuid,
                        }
                    }))
                    .then(storeAttendance)
                    .then(() => {
                        setMembers(members)
                        setLoaded(true)
                    })
            })
        }
    }, [courses])

    return loaded ? (
        <>
            <div className="registerActions">
                <MemberQuickAddButton courses={courses} onChange={() => fetchMembersByCourses(courses).then(setMembers)} />
                <div className='ps-2'>
                    <input type="text" className="form-control" placeholder="Search" onChange={(e) => setGlobalFilter(String(e.target.value))} />
                </div>
            </div>
            <div className="tblRegister">
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
                                            member={row.original}
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
            </div>
        </>
    ) : <Spinner />
}

export default Register
