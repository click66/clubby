import { RowData, SortingState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import '../assets/Register.component.scss'
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
import LogAttendanceModal from './LogAttendanceModal'
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

type RegisterMap = Map<string, Map<string, Map<string, CourseRegisterData>>>

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
    })
]

function Register({ courses = [], squashDates }: RegisterProps) {
    const [dates, setDates] = useState<Session[]>([])
    const [members, setMembers] = useState<Member[]>([])

    const [loaded, setLoaded] = useState(false)
    const [registerData, setRegisterData] = useState<RegisterMap>(new Map())
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined)
    const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined)
    const [showLogModal, setShowLogModal] = useState<boolean>(false)
    const [allowClearAttendance, setAllowClearAttendance] = useState<boolean>(false)

    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
    const [globalFilter, setGlobalFilter] = useState('')

    const closeLogAttendanceModal = () => {
        setSelectedMember(undefined)
        setSelectedSession(undefined)
        setShowLogModal(false)
    }

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

    const isoDate = (date: Date) => date.toISOString().split('T')[0]

    const handleSessionClick = (filled: boolean) => (member: Member, session: Session) => {
        setSelectedMember(member)
        setSelectedSession(session)
        setAllowClearAttendance(filled)
        setShowLogModal(true)
    }

    const lookupAttendance = (date: Date, member: Member, courses: SessionCourse[]): CourseRegisterData | null => {
        return courses.reduce(
            (acc, course: SessionCourse) => acc ?? (registerData.get(member.uuid!)?.get(course.uuid!)?.get(isoDate(date)) ?? null),
            null as CourseRegisterData | null,
        )
    }

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

    const AttendanceBadge = ({ member, session }: { member: Member, session: Session }) => {
        const attendance = lookupAttendance(session.date, member, session.courses)

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

    const RegisterCell = ({
        session,
        member,
    }: { member: Member, session: Session, onClick?: () => void }) => {
        const courses = session.courses.filter((c) => member.course_uuids.includes(c.uuid!))
        return (
            <td onClick={() => handleSessionClick(lookupAttendance(session.date, member, session.courses) != null)(member, session)} className={'registerCell ' + (courses.length == 0 ? 'disabled ' : ' ') + (session === selectedSession && member === selectedMember ? 'selected ' : ' ')}>
                <AttendanceBadge member={member} session={session} />
            </td>
        )
    }

    const RegisterRow = ({ sessions = [], member }: { sessions: Session[], member: Member }) => (
        <>
            {sessions.map((s, i) => (
                <RegisterCell key={i} member={member} session={s} />
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
                                        <RegisterRow sessions={dates} member={row.original} />
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
            {selectedMember && selectedSession ?
                <LogAttendanceModal
                    allowClearAttendance={allowClearAttendance}
                    member={selectedMember}
                    session={selectedSession}
                    show={showLogModal}
                    close={closeLogAttendanceModal}
                    addAttendance={(member: Member, session: Session, { resolution, paymentOption }) => {
                        const newAttendances = [] as CourseRegisterData[]
                        try {
                            const courses = session.courses.filter((c) => c.uuid != undefined && member.courseUuids.includes(c.uuid))

                            courses.forEach((c) => {
                                const payment = (resolution === 'paid' && paymentOption === 'advance' ? { courseUuid: c.uuid! } : null)
                                member.attend({ ...session, payment })
                            })
                            setMembers(members)

                            Promise.all(courses.reduce((acc: Promise<any>[], c: SessionCourse) => {
                                let memberUuid = member.uuid!,
                                    courseUuid = c.uuid

                                newAttendances.push({
                                    id: 0,
                                    studentUuid: memberUuid,
                                    courseUuid,
                                    date: session.date,
                                    resolution: resolution
                                })

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

                            storeAttendance(newAttendances)
                            closeLogAttendanceModal()
                        } catch (e: any) {
                            if (e instanceof DomainError) {
                                notifyError(e.message)
                            }
                        }
                    }}
                    removeAttendance={(member: Member, session: Session) => {
                        try {
                            member.unattend(session)
                            setMembers(members)

                            let data = registerData ? new Map(registerData) : new Map()

                            Promise.all(session.courses.filter((c) => member.isInCourse(c)).reduce((acc: Promise<any>[], c: SessionCourse) => {
                                let memberUuid = member.uuid!,
                                    courseUuid = c.uuid,
                                    date = isoDate(session.date)

                                data.get(memberUuid)?.get(courseUuid)?.delete(date)

                                acc.push(deleteAttendance({
                                    student_uuid: memberUuid,
                                    course_uuid: courseUuid,
                                    date: session.date,
                                }))
                                return acc
                            }, [] as Promise<any>[])).then(() => {
                                notifySuccess('Attendance cleared')
                            }).catch(notifyError)
                            setRegisterData(data)

                            closeLogAttendanceModal()
                        } catch (e: any) {
                            if (e instanceof DomainError) {
                                notifyError(e.message)
                            }
                        }
                    }}
                /> : ''
            }
        </>
    ) : <Spinner />
}

export default Register