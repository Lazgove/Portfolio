import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function WobbleBlob({ color, position }) {
  const meshRef = useRef();
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const scale = 1 + 0.1 * Math.sin(timeRef.current * 2);
    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.x += delta * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.3}
      />
    </mesh>
  );
}

export default function BlobBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      background: 'linear-gradient(#c471f5, #fa71cd)',
    }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        
        {/* Add some animated blobs */}
        <WobbleBlob color="white" position={[0, 0, 0]} />
        <WobbleBlob color="white" position={[2, 1, -1]} />
        <WobbleBlob color="white" position={[-2, -1, 1]} />

        {/* Optional: OrbitControls for debug (remove in prod) */}
        {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      </Canvas>
    </div>
  );
}
