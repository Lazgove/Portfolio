import Navbar from './components/Navbar';
import BlobBackground from './components/BlobBackground';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import { Element } from 'react-scroll';

export default function App() {
  return (
    <div className="relative bg-white text-gray-900">
      <BlobBackground /> {/* Behind everything */}
      <Navbar />
      <main className="pt-20 relative z-10">
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
    </div>
  );
}
