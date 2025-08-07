// JellyMetaballsBackground.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const NUM_METABALLS = 12;

function Metaball({ position, velocity, color }) {
  const ref = useRef();
  const { size, viewport, mouse } = useThree();

  // Convert screen mouse to viewport space
  const getMousePosition = () => {
    return new THREE.Vector3(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );
  };

  useFrame(() => {
    if (!ref.current) return;

    const pos = ref.current.position;
    const mousePos = getMousePosition();

    // Simple attraction
    const dir = new THREE.Vector3().subVectors(mousePos, pos);
    const dist = dir.length();
    if (dist < 3) {
      dir.normalize().multiplyScalar(0.01 * (3 - dist));
      velocity.add(dir);
    }

    // Apply velocity
    pos.add(velocity);

    // Dampen velocity
    velocity.multiplyScalar(0.98);

    // Bounds
    const bound = viewport;
    if (pos.x < -bound.width / 2 || pos.x > bound.width / 2) velocity.x *= -1;
    if (pos.y < -bound.height / 2 || pos.y > bound.height / 2) velocity.y *= -1;
  });

  return (
    <Sphere ref={ref} args={[0.4, 32, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        roughness={0.4}
        metalness={0.3}
      />
    </Sphere>
  );
}

function Metaballs() {
  const balls = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NUM_METABALLS; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          0
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          0
        ),
        color: new THREE.Color(`hsl(${Math.random() * 360}, 70%, 70%)`),
      });
    }
    return arr;
  }, []);

  return (
    <>
      {balls.map((b, i) => (
        <Metaball
          key={i}
          position={b.position.clone()}
          velocity={b.velocity.clone()}
          color={b.color}
        />
      ))}
    </>
  );
}

export default function JellyMetaballsBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    >
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Metaballs />
      </Canvas>
    </div>
  );
}
