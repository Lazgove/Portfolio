import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import WaterPlane from './WaterPlane';
import '../material/WaterMaterial.js'; // <-- ensures `extend()` runs

function ScrollCamera({ topY = 10, bottomY = -95 }) {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    camera.position.y = THREE.MathUtils.lerp(topY, bottomY, scrollProgress);
    camera.lookAt(0, camera.position.y - 5, 0);
  });

  return null;
}

export default function OceanScene() {
  return (
    <Canvas
      camera={{ position: [0, 10, 30], fov: 30, near: 0.1, far: 1000 }}
      shadows
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 50, 50]} intensity={1.5} castShadow />

      <ScrollCamera topY={10} bottomY={-95} />

      <WaterPlane />

      <mesh position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#8B7D5B" />
      </mesh>
    </Canvas>
  );
}
