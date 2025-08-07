import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const NUM_PARTICLES = 200;

function Particles() {
  const meshRef = useRef();
  const { mouse, viewport } = useThree();

  // Initialize particles data (positions + velocities)
  const particlesData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * viewport.width,
          (Math.random() - 0.5) * viewport.height,
          (Math.random() - 0.5) * 2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002
        ),
      });
    }
    return temp;
  }, [viewport]);

  useFrame(() => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array;

    const mousePos = new THREE.Vector3(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const idx3 = i * 3;
      const pos = new THREE.Vector3(
        positions[idx3],
        positions[idx3 + 1],
        positions[idx3 + 2]
      );

      // Simple attraction to mouse if close enough
      const dist = pos.distanceTo(mousePos);
      if (dist < 1) {
        const attractionForce = mousePos.clone().sub(pos).multiplyScalar(0.01 * (1 - dist));
        particlesData[i].velocity.add(attractionForce);
      }

      // Update position by velocity
      particlesData[i].position.add(particlesData[i].velocity);

      // Dampen velocity
      particlesData[i].velocity.multiplyScalar(0.95);

      // Keep particles inside viewport bounds
      if (particlesData[i].position.x > viewport.width / 2) particlesData[i].velocity.x *= -1;
      if (particlesData[i].position.x < -viewport.width / 2) particlesData[i].velocity.x *= -1;
      if (particlesData[i].position.y > viewport.height / 2) particlesData[i].velocity.y *= -1;
      if (particlesData[i].position.y < -viewport.height / 2) particlesData[i].velocity.y *= -1;
      if (particlesData[i].position.z > 2) particlesData[i].velocity.z *= -1;
      if (particlesData[i].position.z < -2) particlesData[i].velocity.z *= -1;

      // Write new positions back to buffer
      positions[idx3] = particlesData[i].position.x;
      positions[idx3 + 1] = particlesData[i].position.y;
      positions[idx3 + 2] = particlesData[i].position.z;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Create BufferGeometry with initial positions
  const positions = useMemo(() => {
    const posArray = new Float32Array(NUM_PARTICLES * 3);
    particlesData.forEach((p, i) => {
      posArray[i * 3] = p.position.x;
      posArray[i * 3 + 1] = p.position.y;
      posArray[i * 3 + 2] = p.position.z;
    });
    return posArray;
  }, [particlesData]);

  return (
    <points ref={meshRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attachObject={['attributes', 'position']}
          count={NUM_PARTICLES}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        color="#a8a8ff"
        size={0.03}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.15}
      />
    </points>
  );
}

export default function FloatingParticlesBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none', // allows clicking through canvas
      }}
    >
      <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 10] }}>
        <Particles />
      </Canvas>
    </div>
  );
}
