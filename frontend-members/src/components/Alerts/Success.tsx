import { AlertProps } from './types'

export default function Success({ title = null, children }: AlertProps) {
    return (
        <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 w-full" role="alert">
            {title ? <div className="font-medium">{title}</div> : ''}
            <div>{children}</div>
        </div>
    )
}
