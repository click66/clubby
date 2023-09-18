import { Link } from "react-router-dom"

function Breadcrumb() {
    return (
        <nav aria-label="breadcrumb" className="text-light">
            <ol className="breadcrumb">
                <li key="home" className="breadcrumb-item">
                    <Link to="/">Home</Link>
                </li>
            </ol>
        </nav>
    )
}

export default Breadcrumb