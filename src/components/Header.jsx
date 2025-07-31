import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Lazlanove</h1>
      <nav className="space-x-4">
        <Link to="/" className="hover:text-yellow-400">Home</Link>
        <Link to="/about" className="hover:text-yellow-400">About</Link>
        <Link to="/projects" className="hover:text-yellow-400">Projects</Link>
      </nav>
    </header>
  )
}