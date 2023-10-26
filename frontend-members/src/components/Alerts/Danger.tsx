import { AlertProps } from './types'

export default function Danger({ title = null, children }: AlertProps) {
    return (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 w-full" role="alert">
            {title ? <div className="font-medium">{title}</div> : ''}
            <div>{children}</div>
        </div>
    )
}
