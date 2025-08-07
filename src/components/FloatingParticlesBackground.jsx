import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const NUM_PARTICLES = 200;

function Particles() {
  const pointsRef = useRef();
  const { mouse } = useThree();

  // Initialize particle positions and velocities
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array;
    const mousePos = new THREE.Vector3(mouse.x * 2, mouse.y * 2, 0); // Scale mouse coords

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const idx = i * 3;
      const pos = new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      );

      // Attract particles within radius 1.5
      const dist = pos.distanceTo(mousePos);
      if (dist < 1.5) {
        const dir = mousePos.clone().sub(pos).multiplyScalar(0.02 * (1.5 - dist));
        particles[i].velocity.add(dir);
      }

      particles[i].position.add(particles[i].velocity);
      particles[i].velocity.multiplyScalar(0.95);

      // Bounce inside box [-2,2]
      ["x", "y", "z"].forEach((axis) => {
        if (particles[i].position[axis] > 2 || particles[i].position[axis] < -2)
          particles[i].velocity[axis] *= -1;
      });

      positions[idx] = particles[i].position.x;
      positions[idx + 1] = particles[i].position.y;
      positions[idx + 2] = particles[i].position.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Initial position buffer
  const positions = useMemo(() => {
    const arr = new Float32Array(NUM_PARTICLES * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.position.x;
      arr[i * 3 + 1] = p.position.y;
      arr[i * 3 + 2] = p.position.z;
    });
    return arr;
  }, [particles]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          count={NUM_PARTICLES}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#99ccff"
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function FloatingParticlesBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles />
      </Canvas>
    </div>
  );
}
