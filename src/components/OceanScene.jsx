import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';

// Camera movement based on scroll position
function ScrollCamera() {
  const { camera } = useThree();

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY || window.pageYOffset;
      camera.position.y = 5 + scrollY * 0.01; // Move camera up/down
      camera.position.z = 5 + scrollY * 0.02; // Move camera forward/back
      camera.lookAt(0, 0, 0);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [camera]);

  return null;
}

// Simple ground plane
function GroundPlane({ size = 20 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#444" />
    </mesh>
  );
}

export default function OceanScene() {
  return (
    <Canvas
      camera={{ position: [0, 5, 5], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x202840));
      }}
    >
      {/* Lights */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 7]} intensity={1} />

      {/* Scroll-based camera */}
      <ScrollCamera />

      {/* Ground */}
      <GroundPlane />
    </Canvas>
  );
}
