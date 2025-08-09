// OceanScene.jsx
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';

function ScrollCamera() {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    // Map scroll 0 → 1 to camera.y 5 → -20
    camera.position.y = THREE.MathUtils.lerp(5, -20, scrollProgress);
    camera.lookAt(0, camera.position.y, 0); // Keep looking at horizontal center
  });

  return null;
}

function WaterSurface() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, 1, 1]} />
      <meshPhysicalMaterial
        color={0x3399ff}
        transparent
        opacity={0.7}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

function SeaFloor() {
  return (
    <mesh position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 1, 1]} />
      <meshStandardMaterial color={0x886644} />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      {/* Above water sunlight */}
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <ambientLight intensity={0.3} />
    </>
  );
}

export default function OceanScene() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}
      camera={{ position: [0, 5, 15], fov: 50 }}
    >
      <ScrollCamera />
      <Lights />
      <WaterSurface />
      <SeaFloor />
      {/* Optional: for testing movement */}
      {/* <OrbitControls /> */}
    </Canvas>
  );
}
