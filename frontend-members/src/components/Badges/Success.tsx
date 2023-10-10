import { PropsWithChildren } from 'react'

export default function Success({ children }: PropsWithChildren) {
    return (
        <span
            className="inline-block whitespace-nowrap rounded-full bg-success px-[0.65em] pb-[0.25em] pt-[0.35em] text-center align-baseline text-[0.75em] font-bold leading-none text-light" >
            {children}
        </span>
    )
}
