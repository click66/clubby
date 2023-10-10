import { AlertProps } from './types'

export default function Warning({ title = null, children }: AlertProps) {
    return (
        <div className="p-4 mb-4 text-sm text-orange-700 rounded-lg bg-orange-100 w-full" role="alert">
            {title ? <div className="font-medium">{title}</div> : ''}
            <div>{children}</div>
        </div>
    )
}
