import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const NUM_PARTICLES = 200;

function Particles() {
  const meshRef = useRef();
  const { mouse } = useThree();

  const particlesData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
      });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array;

    // Convert mouse from [-1,1] range to world coords roughly centered at 0
    const mousePos = new THREE.Vector3(mouse.x, mouse.y, 0);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const idx3 = i * 3;
      const pos = new THREE.Vector3(
        positions[idx3],
        positions[idx3 + 1],
        positions[idx3 + 2]
      );

      // Attract particles softly to mouse position if close
      const dist = pos.distanceTo(mousePos);
      if (dist < 0.5) {
        const attractionForce = mousePos.clone().sub(pos).multiplyScalar(0.02 * (0.5 - dist));
        particlesData[i].velocity.add(attractionForce);
      }

      particlesData[i].position.add(particlesData[i].velocity);
      particlesData[i].velocity.multiplyScalar(0.9);

      // Keep particles in cube [-1,1]
      ['x','y','z'].forEach(axis => {
        if (particlesData[i].position[axis] > 1) particlesData[i].velocity[axis] *= -1;
        if (particlesData[i].position[axis] < -1) particlesData[i].velocity[axis] *= -1;
      });

      positions[idx3] = particlesData[i].position.x;
      positions[idx3 + 1] = particlesData[i].position.y;
      positions[idx3 + 2] = particlesData[i].position.z;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

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
        color="#a8a8ff"
        size={5.8}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
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
        pointerEvents: 'none',
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles />
      </Canvas>
    </div>
  );
}
