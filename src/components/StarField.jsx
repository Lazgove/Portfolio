import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Stars({ count = 600 }) {
  const stars = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const radius = 15 + Math.random() * 15;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const scale = 0.03 + Math.random() * 0.09;

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
        <mesh key={i} position={position} scale={[scale, scale, scale]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}
    </>
  );
}

function StarField() {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
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
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          height={300}
          intensity={0.3}
        />
      </EffectComposer>
    </Canvas>
  );
}

export default StarField;
