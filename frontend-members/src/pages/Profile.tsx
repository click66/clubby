import { PropsWithChildren, useContext, useEffect, useState } from 'react'
import { Member } from '../apis/members/members'
import { members } from '../apis/members/provider'
import { UserContext } from '../contexts/UserContext'
import Spinner from '../components/Spinner'
import { Danger, Warning } from '../components/Alerts'
import { Danger as DangerBadge, Success, Warning as WarningBadge } from '../components/Badges'
import { Field, Form, Formik } from 'formik'

interface HasMember {
    member: Member
}

type MemberCardProps = HasMember & PropsWithChildren & {
    initiallyActive?: boolean
}


function LicenceBadge({ member }: HasMember) {
    if (member.licence && member.licence.expiryDate > new Date()) {
        return <Success>Licenced</Success>
    }

    if (member.licence && member.licence.expiryDate <= new Date()) {
        return <DangerBadge>Expired</DangerBadge>
    }

    if (!member.licence) {
        if (member.remainingTrialSessions > 0) {
            return <WarningBadge>Trial</WarningBadge>
        }
        return <DangerBadge>Unlicenced</DangerBadge>
    }
}

function ProfileForm({ member }: HasMember) {
    return (
        <Formik
            initialValues={member}
            onSubmit={(values, { setSubmitting }) => {

            }}
        >
            {({ isSubmitting }) => (
                <Form>
                    <div className="p-8">
                        <div className="flex flex-wrap -mx-3 mb-6">
                            <div className="w-full md:w-1/2 px-3">
                                <label className="block tracking-wide text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                                    Phone
                                </label>
                                <Field name="phone" className="appearance-none text-sm block w-full bg-gray-100 text-gray-700 border border-gray-200 rounded py-3 px-4 focus:outline-none focus:bg-white focus:border-primary" id="phone" type="text" />
                            </div>
                            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                                <label className="block tracking-wide text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfBirth">
                                    Date of Birth
                                </label>
                                <Field name="dateOfBirth" className="appearance-none text-sm block w-full bg-gray-100 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 focus:outline-none focus:bg-white" id="dateOfBirth" type="text" />
                            </div>
                        </div>
                        <div className="flex flex-wrap -mx-3 mb-6">
                            <div className="w-full px-3">
                                <label className="block tracking-wide text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                                    Address
                                </label>
                                <Field name="address" className="appearance-none text-sm minblock w-full bg-gray-100 text-gray-700 border border-gray-200 rounded py-3 px-4 focus:outline-none focus:bg-white focus:border-primary" id="address" type="text" component="textarea" />
                            </div>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    )
}

function MemberCard({ initiallyActive = false, member, children }: MemberCardProps) {
    const [active, setActive] = useState<boolean>(initiallyActive)

    function handleClick() {
        setActive((old) => !old)
    }

    return (
        <div className="w-full bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700">
            <div className="flex flex-row w-full justify-start p-4 cursor-pointer" onClick={handleClick}>
                <h2 className="grow font-medium text-neutral-800">
                    {member.name}
                </h2>
                <div className="mx-5">
                    <LicenceBadge member={member} />
                </div>
                <span
                    className={`${active
                        ? `rotate-[-180deg]`
                        : `rotate-0 fill-[#212529]  dark:fill-white`
                        } ml-auto h-5 w-5 shrink-0 fill-[#336dec] transition-transform duration-200 ease-in-out motion-reduce:transition-none dark:fill-blue-300`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-6 w-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                    </svg>
                </span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${active ? 'max-h-screen border-t' : 'max-h-0 border-t-0'}`}>
                {children}
            </div>
        </div>
    )
}

export default function Profile() {
    const [error, setError] = useState<Error | null>(null)
    const [pending, setPending] = useState<boolean>(true)
    const [user, _] = useContext(UserContext)
    const [membersData, setMembersData] = useState<Member[]>([])

    useEffect(() => {
        if (user !== null) {
            members.getMembers({ user: user.uuid })
                .then(setMembersData)
                .catch(setError)
                .finally(() => { setPending(false) })
        }
    }, [])

    if (pending) {
        return <Spinner />
    }

    if (error) {
        return <Danger>Failed to read profile data.</Danger>
    }

    return (
        <>
            {membersData.map((member: Member, index) => (
                <MemberCard key={index} member={member} initiallyActive={membersData.length === 1}>
                    {!member.licence ? <div className="p-8 pb-0"><Warning>You have {member.remainingTrialSessions} trial sessions remaining.</Warning></div>: ''}
                    <ProfileForm member={member} />
                </MemberCard>
            ))}
        </>
    )
}
