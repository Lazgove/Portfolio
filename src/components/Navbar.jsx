import { Link } from 'react-scroll';

export default function Navbar() {
  const links = [
    { name: 'Home', to: 'home' },
    { name: 'About', to: 'about' },
    { name: 'Projects', to: 'projects' },
    { name: 'Contact', to: 'contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-80 shadow">
      <ul className="flex justify-center gap-6 p-4 text-white">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              to={link.to}
              smooth={true}
              duration={500}
              offset={-70} // adjust for fixed nav height
              className="cursor-pointer hover:text-blue-400 transition"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}