import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Stars({ count = 600 }) {
  // Create star positions and sizes with some clustering effect
  const stars = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // Distribute stars within a sphere radius 30
      const radius = 15 + Math.random() * 15; // cluster more around 15-30 radius
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Random small scale between 0.03 and 0.12
      const scale = 0.03 + Math.random() * 0.09;

      // Pastel-ish white/yellow colors for star variety
      const color = new THREE.Color(
        0.9 + 0.1 * Math.random(),
        0.85 + 0.15 * Math.random(),
        0.6 + 0.4 * Math.random()
      );

      temp.push({ position: [x, y, z], scale, color });
    }
    return temp;
  }, [count]);

  return (
    <>
      {stars.map(({ position, scale, color }, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.2}
          />
          <primitive
            object={new THREE.Object3D()}
            scale={[scale, scale, scale]}
          />
        </mesh>
      ))}
    </>
  );
}

function NebulaStarField() {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005; // slow rotation for subtle effect
      groupRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <Canvas
      camera={{ position: [0, 0, 40], fov: 60 }}
      style={{ position: "fixed", inset: 0, zIndex: -1, background: "black" }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <group ref={groupRef}>
        <Stars count={600} />
      </group>

      {/* Less intense bloom */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          height={300}
          intensity={0.3}  // subtle glow
        />
      </EffectComposer>
    </Canvas>
  );
}

export default NebulaStarField;
