import { PropsWithChildren } from 'react'

export default function Warning({ children }: PropsWithChildren) {
    return (
        <span
            className="inline-block whitespace-nowrap rounded-full bg-warning px-[0.65em] pb-[0.25em] pt-[0.35em] text-center align-baseline text-[0.75em] font-bold leading-none text-dark" >
            {children}
        </span>
    )
}
