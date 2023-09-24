import '../assets/Register.component.scss'

import { RowData, SortingState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Member } from '../models/Member'
import { fetchMembersByCourses } from '../services/members'
import { notifyError, notifySuccess } from '../utils/notifications'
import { MemberQuickAddButton } from './MemberQuickAdd'
import { Fragment, useEffect, useState } from 'react'
import { deleteAttendance, fetchAttendances, logAttendance } from '../services/attendance'
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

interface RegisterCellProps {
    attendance: MemberCourseAttendance,
    session: Session,
    member: Member,
    addAttendance: (member: Member, session: Session, { resolution, paymentOption }: { resolution: string, paymentOption: string }) => void,
    removeAttendance: (member: Member, session: Session) => void,
}

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        courses: Course[],
        registerData: RegisterMap,
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

const isoDate = (date: Date) => date.toISOString().split('T')[0]

function AttendanceBadge({ attendance }: { attendance: CourseRegisterData | null }) {
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

function RegisterCell({
    attendance,
    session,
    member,
    addAttendance,
    removeAttendance,
}: RegisterCellProps) {
    const [selected, setSelected] = useState(false)

    const courses = session.courses.filter((c) => member.isInCourse(c))
    const [sessionAttendance, setSessionAttendance] = useState(courses.reduce(
        (acc, course: SessionCourse) => acc ?? (attendance.get(course.uuid)?.get(isoDate(session.date)) ?? null),
        null as CourseRegisterData | null,
    ))

    const disabled = courses.length === 0

    return (
        <td onClick={(e) => {
            setSelected(true)
            setTimeout(() => {
                setSelected(false)
            }, 2000)
            renderLogAttendanceModal(e.target as Node, {
                allowClearAttendance: sessionAttendance !== null,
                member: member,
                session: session,
                addAttendance: (member, session, { resolution, paymentOption }) => {
                    setSessionAttendance({
                        id: 0,
                        courseUuid: session.courses[0].uuid,
                        resolution,
                        studentUuid: member.uuid,
                        date: session.date,
                    })
                    addAttendance(member, session, { resolution, paymentOption })
                },
                removeAttendance: (member, session) => {
                    setSessionAttendance(null)
                    removeAttendance(member, session)
                },
            })
        }} className={'registerCell ' + (disabled ? 'disabled ' : ' ') + (selected ? 'selected ' : ' ')}>
            <AttendanceBadge attendance={sessionAttendance} />
        </td>
    )
}

function Register({ courses = [], squashDates }: RegisterProps) {
    const [dates, setDates] = useState<Session[]>([])
    const [members, setMembers] = useState<Member[]>([])

    const [loaded, setLoaded] = useState(false)
    const [registerData, setRegisterData] = useState<RegisterMap>(new Map())

    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
    const [globalFilter, setGlobalFilter] = useState('')

    const table = useReactTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: { courses, registerData },
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
    })

    const lookupMemberAttendance = (member: Member) => registerData.get(member.uuid) ?? new Map()

    const storeAttendance = (data: CourseRegisterData[]) =>
        setRegisterData((map: RegisterMap) => data.reduce((acc: RegisterMap, d: CourseRegisterData) => {
            const { studentUuid, courseUuid, date } = d
            acc.set(studentUuid, acc.get(studentUuid) || new Map())
            acc.get(studentUuid)!.set(courseUuid, acc.get(studentUuid)!.get(courseUuid) || new Map())
            acc.get(studentUuid)!.get(courseUuid)!.set(isoDate(date), d)
            return acc
        }, map))

    useEffect(() => {
        if (courses.length) {
            fetchMembersByCourses(courses).then((members) => {
                const dates = generatePrevious30Dates(courses, squashDates)
                setDates(dates)

                // Might be more efficient to have the attendance API read by course, then these can be performed in unison
                const studentUuids = members.map((m) => m.uuid).filter(Boolean) as string[]
                return Promise.all(courses.map((c) => fetchAttendances({
                    student_uuids: studentUuids,
                    course_uuid: c.uuid,
                    date_earliest: dates[dates.length - 1].date,
                    date_latest: dates[0].date,
                }))).then((data: CourseRegisterData[][]) => {
                    storeAttendance(data.flat())
                    setMembers(members)
                    setLoaded(true)
                })
            })
        }
    }, [courses])

    const addAttendance = (member: Member, session: Session, { resolution, paymentOption }: { resolution: string, paymentOption: string }) => {
        try {
            const courses = session.courses.filter((c) => member.isInCourse(c))

            courses.forEach((c) => {
                const payment = (resolution === 'paid' && paymentOption === 'advance' ? { courseUuid: c.uuid! } : null)
                member.attend({ ...session, payment })
            })
            setMembers(members)

            Promise.all(courses.reduce((acc: Promise<any>[], c: SessionCourse) => {
                let memberUuid = member.uuid!,
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
                notifySuccess('Attendance recorded')
            }).catch(notifyError)
        } catch (e: any) {
            if (e instanceof DomainError) {
                notifyError(e.message)
            }
        }
    }
    const removeAttendance = (member: Member, session: Session) => {
        try {
            member.unattend(session)
            setMembers(members)

            Promise.all(session.courses.filter((c) => member.isInCourse(c)).reduce((acc: Promise<any>[], c: SessionCourse) => {
                let memberUuid = member.uuid,
                    courseUuid = c.uuid

                acc.push(deleteAttendance({
                    student_uuid: memberUuid,
                    course_uuid: courseUuid,
                    date: session.date,
                }))
                return acc
            }, [] as Promise<any>[])).then(() => {
                notifySuccess('Attendance cleared')
            }).catch(notifyError)
        } catch (e: any) {
            if (e instanceof DomainError) {
                notifyError(e.message)
            }
        }
    }

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

    const RegisterRow = ({ sessions = [], attendance, member }: { sessions: Session[], attendance: MemberCourseAttendance, member: Member }) => (
        <>
            {sessions.map((s, i) => (
                <RegisterCell
                    key={i}
                    attendance={attendance}
                    member={member}
                    session={s}
                    addAttendance={addAttendance}
                    removeAttendance={removeAttendance}
                />
            ))}
        </>
    )

    return loaded ? (
        <>
            <div className="registerActions">
                <MemberQuickAddButton courses={courses} onChange={() => {
                    fetchMembersByCourses(courses).then(setMembers)
                }} />
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
                                        <RegisterRow member={row.original} sessions={dates} attendance={lookupMemberAttendance(row.original)} />
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