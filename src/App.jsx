import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import { Element } from 'react-scroll';
import MetaballBackground from './components/MetaballBackground'; // <-- 👈 Add this import
import OceanScene from './components/OceanScene';

export default function App() {
  return (
    <>
      <OceanScene  /> {/* 👈 Background canvas behind everything */}
    </>
  );
}
