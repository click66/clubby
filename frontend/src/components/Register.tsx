import { RowData, SortingState, createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import '../assets/Register.component.scss'
import Course from '../models/Course';
import Member from '../models/Member';
import { fetchMembersByCourses } from '../services/members';
import { notifyError, notifySuccess } from '../utils/notifications';
import { MemberQuickAddButton } from './MemberQuickAdd'
import { Fragment, useEffect, useState } from 'react';
import { deleteAttendance, fetchAttendances, logAttendance } from '../services/attendance';
import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BoxArrowUpRight, Cash } from 'react-bootstrap-icons';
import MemberBadge from './MemberBadge';
import { DomainError } from '../errors';
import LogAttendanceModal from './LogAttendanceModal';

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        courses: Course[]
    }
}

type Session = {
    courses: Course[],
    date: Date,
}

interface RegisterProps {
    courses: Course[]
    squashDates: boolean
}

interface CourseRegisterData {
    id: number
    course_uuid: string
    resolution: string
    student_uuid: string
    date: Date
}

function generatePrevious30Dates(courses: Course[], squash: boolean): Session[] {
    const result: Session[] = [];
    const currentDate = new Date();
    let daysCount = 0;

    courses = courses.filter((c) => c.uuid != undefined)

    while (result.length < 30 && daysCount < 365) {
        const matchingCourses = courses.filter(obj => obj.days.includes((currentDate.getDay() + 6) % 7));    // For some reason I didn't index Sunday as 0

        if (matchingCourses.length > 0) {
            if (squash) {
                result.push({ courses: matchingCourses, date: new Date(currentDate) })
            } else {
                matchingCourses.forEach((course) => result.push({
                    courses: [course],
                    date: new Date(currentDate)
                }));
            }
        }

        currentDate.setDate(currentDate.getDate() - 1);
        daysCount++;
    }

    return result;
}

const columnHelper = createColumnHelper<Member>()
const columns = [
    columnHelper.accessor(r => r.name, {
        id: 'name',
        header: 'Member',
        cell: ({ getValue, row, table }) => <>
            <span className="memberName">{getValue()}</span>
            <span className="memberLicence"><MemberBadge member={row.original} /></span>
            <span className="memberIcons">{table.options.meta?.courses
                .map((c: Course) => row.original.hasUsablePaymentForCourse(c as { uuid: string }))
                .includes(true) ? <Cash /> : ''}</span>
        </>,
    }),
]

function Register({ courses = [], squashDates }: RegisterProps) {
    const [dates, setDates] = useState<Session[]>([])
    const [members, setMembers] = useState<Member[]>([])

    const [loaded, setLoaded] = useState(false)
    const [registerData, setRegisterData] = useState<Map<string, Map<string, Map<string, CourseRegisterData>>>>(new Map())
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined)
    const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined)
    const [showLogModal, setShowLogModal] = useState<boolean>(false)
    const [allowClearAttendance, setAllowClearAttendance] = useState<boolean>(false)

    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

    const table = useReactTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: { courses },
        state: {
            sorting,
        },
        onSortingChange: setSorting,
    })

    const isoDate = (date: Date) => date.toISOString().split('T')[0]

    const handleSessionClick = (filled: boolean) => (member: Member, session: Session) => {
        setSelectedMember(member)
        setSelectedSession(session)
        setAllowClearAttendance(filled)
        setShowLogModal(true)
    }

    const lookupAttendance = (date: Date, member: Member, courses: Course[]): CourseRegisterData | null => courses.reduce(
        (acc, course: Course) => acc ?? (registerData.get(member.uuid!)?.get(course.uuid!)?.get(isoDate(date)) ?? null),
        null as CourseRegisterData | null,
    )

    useEffect(() => {
        fetchMembersByCourses(courses).then((members) => {
            const dates = generatePrevious30Dates(courses, squashDates)
            setDates(dates)
            setMembers(members)

            // Might be more efficient to have the attendance API read by course, then these can be performed in unison
            const student_uuids = members.map((m) => m.uuid).filter(Boolean) as string[]
            Promise.all(courses.map((c) => fetchAttendances({
                student_uuids,
                course_uuid: c.uuid!,
                date_earliest: dates[dates.length - 1].date,
                date_latest: dates[0].date,
            }))).then((data: CourseRegisterData[][]) => data.flat().reduce((map, obj) => {
                const { student_uuid, course_uuid, date } = obj;
                map.set(student_uuid, map.get(student_uuid) || new Map());
                map.get(student_uuid).set(course_uuid, map.get(student_uuid).get(course_uuid) || new Map());
                map.get(student_uuid).get(course_uuid).set(date, obj);
                return map;
            }, new Map())).then(setRegisterData).then(() => { setLoaded(true) }).catch(notifyError)
        })
    }, [courses])

    const AttendanceBadge = ({ date, member, courses }: { date: Date, member: Member, courses: Course[] }) => {
        const attendance = lookupAttendance(date, member, courses)

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
            <td onClick={() => handleSessionClick(lookupAttendance(session.date, member, session.courses) != null)(member, session)} className={'registerCell ' + (courses.length == 0 ? 'disabled' : '')}>
                <AttendanceBadge date={session.date} member={member} courses={session.courses} />
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
                <MemberQuickAddButton courses={courses} />
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
                    close={() => setShowLogModal(false)}
                    addAttendance={(member: Member, session: Session, { resolution, paymentOption }) => {
                        try {
                            member.attend({ ...session, payment: resolution === 'paid' && paymentOption === 'advance' ? { courseUuid: session.courses[0].uuid! } : null }) // TODO Just handling first course payment rn
                            setMembers(members)

                            let data = registerData ? new Map(registerData) : new Map()
                            Promise.all(session.courses.filter((c) => c.uuid != undefined && member.courseUuids.includes(c.uuid)).reduce((acc: Promise<any>[], c: Course) => {
                                let memberUuid = member.uuid!,
                                    courseUuid = c.uuid!,
                                    date = isoDate(session.date)

                                data.set(memberUuid, data.get(memberUuid) || new Map())
                                data.get(memberUuid).set(courseUuid, data.get(memberUuid).get(courseUuid) || new Map())
                                data.get(memberUuid).get(courseUuid).set(date, {
                                    id: 0,
                                    course_uuid: courseUuid,
                                    resolution: resolution,
                                    student_uuid: memberUuid,
                                    date: session.date,
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

                            setRegisterData(data)
                            setShowLogModal(false)
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

                            Promise.all(session.courses.filter((c) => c.uuid != undefined && member.course_uuids.includes(c.uuid)).reduce((acc: Promise<any>[], c: Course) => {
                                let memberUuid = member.uuid!,
                                    courseUuid = c.uuid!,
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

                            setShowLogModal(false)
                        } catch (e: any) {
                            if (e instanceof DomainError) {
                                notifyError(e.message)
                            }
                        }
                    }}
                /> : ''
            }
        </>
    ) : 'Loading...'
}

export default Register