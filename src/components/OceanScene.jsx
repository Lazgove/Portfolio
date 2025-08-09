import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';

// ... your existing AnimatedNoisyPlane, StaticNoisyPlane, ScrollCamera, Lights, FogAndSkySwitcher ...

// New CausticsOverlay component
function CausticsOverlay({ position, size = 500 }) {
  const meshRef = useRef();
  const texture = useMemo(() => {
    // Generate a simple procedural caustics pattern canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Simple radial caustics pattern with some noise
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 5 + Math.random() * 15;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Animate texture offset to simulate caustics movement
      texture.offset.x = (clock.getElapsedTime() * 0.05) % 1;
      texture.offset.y = (clock.getElapsedTime() * 0.02) % 1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1] + 0.1, position[2]]} // Slightly above ground
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.3}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// New LightRays component
function LightRays({ count = 6, radius = 30, height = 50 }) {
  const { camera } = useThree();
  const groupRef = useRef();

  // Create cone geometry with gradient transparency using a custom shaderMaterial or simple transparent texture

  const coneGeometry = useMemo(() => {
    // A cone with a circular base and height, representing a light ray
    return new THREE.ConeGeometry(radius * 0.3, height, 20, 1, true);
  }, [radius, height]);

  // Simple gradient texture for cone - create a canvas texture with radial gradient
  const gradientTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Radial gradient white center to transparent edge
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const depthFactor = THREE.MathUtils.clamp((10 - camera.position.y) / 95, 0, 1);
    groupRef.current.children.forEach(child => {
      child.material.opacity = depthFactor * 0.3; // max 0.3 opacity, fade out deeper
    });
  });

  return (
    <group ref={groupRef} position={[0, 10, 0]}>
      {[...Array(count)].map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={coneGeometry}
            position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            rotation={[Math.PI, angle, 0]}
            renderOrder={10} // render on top
          >
            <meshBasicMaterial
              map={gradientTexture}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
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
      shadows
      camera={{ position: [0, 10, 30], fov: 30, near: 0.5, far: 1000 }}
    >
      <FogAndSkySwitcher />
      <ScrollCamera topY={10} bottomY={-95} />
      <Lights />

      {/* Water surface */}
      <AnimatedNoisyPlane
        position={[0, 0, 0]}
        color={0x3fa9f5}
        noiseScale={0.3}
        noiseStrength={0.4}
      />

      {/* Sandy ground */}
      <StaticNoisyPlane
        position={[0, -100, 0]} // lowered from -85 to -95
        color={0x8B7D5B}
        noiseScale={0.15}
        noiseStrength={1.3}
      />

      {/* Caustics overlay on ground */}
      <CausticsOverlay position={[0, -100, 0]} />

      {/* Light rays from sky */}
      <LightRays count={8} radius={40} height={60} />
    </Canvas>
  );
}
