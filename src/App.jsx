import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import { Element } from 'react-scroll';
import MetaballBackground from './components/MetaballBackground'; // <-- 👈 Add this import
import StarField from './components/StarField';

export default function App() {
  return (
    <>
      <StarField  /> {/* 👈 Background canvas behind everything */}
      <Navbar />
      <main className="pt-20 relative z-10"> {/* Ensure content sits above canvas */}
        <Element name="home">
          <Home />
        </Element>
        <Element name="about">
          <About />
        </Element>
        <Element name="projects">
          <Projects />
        </Element>
        <Element name="contact">
          <Contact />
        </Element>
      </main>
    </>
  );
}
