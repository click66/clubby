import { ReactNode, useState } from 'react'

function MemberCard({ initiallyActive = false, children }: { initiallyActive?: boolean, children: ReactNode }) {
    const [active, setActive] = useState<boolean>(initiallyActive)

    function handleClick() {
        setActive((old) => !old)
    }

    return (
        <div className="w-full bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700">
            <div className="flex flex-row w-full justify-start p-4 cursor-pointer" onClick={handleClick}>
                <h2 className="grow font-medium text-neutral-800">
                    Simone Pumba
                </h2>
                <div className="mx-5">
                    <span
                        className="inline-block whitespace-nowrap rounded-full bg-success px-[0.65em] pb-[0.25em] pt-[0.35em] text-center align-baseline text-[0.75em] font-bold leading-none text-light">
                        Licenced
                    </span>
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
            <div className={`overflow-hidden transition-all duration-300 ${active ? 'h-32 border-t' : 'h-0 border-t-0'
                }`}>
                {children}
            </div>
        </div>
    )
}

export default function Profile() {
    return (
        <>
            <MemberCard initiallyActive={true}>
                <div className="m-4">
                    <p className="text-center">Simone is fully licenced until Oct 28, 2023</p>
                </div>
            </MemberCard>
            <MemberCard>
                <div className="m-4">
                    <p className="text-center">Simone is fully licenced until Oct 28, 2023</p>
                </div>
            </MemberCard>
        </>
    )
}
