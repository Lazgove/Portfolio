import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Water } from './WaterPatched'; // path to above WaterPatched.js
import { Vector3 } from 'three';

function WaterScene() {
  const waterRef = useRef();
  const { gl } = useThree();

  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.update(clock.getElapsedTime());
    }
  });

  return (
    <Water
      ref={waterRef}
      renderer={gl}
      distortionScale={20}
    />
  );
}

export default function App() {
  return (
    <Canvas gl={{ version: 2 }} camera={{ position: [30, 30, 100], fov: 55, near: 1, far: 20000 }}>
      <WaterScene />
    </Canvas>
  );
}
