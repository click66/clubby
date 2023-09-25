import { Link } from 'react-router-dom'

interface BreadcrumbElement {
    path: string
    text: string
}

const Breadcrumb = ({ parent }: { parent: BreadcrumbElement | null }) => (
    <nav aria-label="breadcrumb" className="text-light">
        <ol className="breadcrumb">
            <li key="home" className="breadcrumb-item">
                <Link to="/">Home</Link>
            </li>
                {parent ? <li><Link to={parent.path}>{parent.text}</Link></li> : ''}
        </ol>
    </nav>
)

export default Breadcrumb
