import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header>
      <h1>Lazlanove</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/projects">Projects</Link>
      </nav>
    </header>
  )
}