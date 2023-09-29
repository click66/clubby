import { BoxArrowUpRight } from 'react-bootstrap-icons'
import { Link, LinkProps } from 'react-router-dom'

export default function EscapeLink({ to, children, ...restProps }: LinkProps) {
    return (
        <Link to={to} {...restProps}><BoxArrowUpRight />&nbsp;{children}</Link>
    )
}
