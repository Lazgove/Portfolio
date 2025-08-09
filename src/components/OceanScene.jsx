// OceanScene.jsx
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';

function AnimatedNoisyPlane({ position, color, size = 500, noiseScale = 0.5, noiseStrength = 1 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const geometry = meshRef.current.geometry;
    const positionAttr = geometry.attributes.position;
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const wave = Math.sin(x * noiseScale + time * 0.3) * Math.cos(y * noiseScale + time * 0.3);
      positionAttr.setZ(i, wave * noiseStrength);
    }
    positionAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size, 200, 200]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.8}
        roughness={0.8}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function StaticNoisyPlane({ position, color, size = 500, noiseScale = 0.5, noiseStrength = 1 }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, 200, 200);
    const positionAttr = geo.attributes.position;
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const wave = Math.sin(x * noiseScale) * Math.cos(y * noiseScale);
      positionAttr.setZ(i, wave * noiseStrength);
    }
    positionAttr.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [size, noiseScale, noiseStrength]);

  return (
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function ScrollCamera({ topY = 10, bottomY = -55 }) {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    camera.position.y = THREE.MathUtils.lerp(topY, bottomY, scrollProgress);
    camera.lookAt(0, camera.position.y - 5, 0);
  });

  return null;
}

function Lights() {
  return (
    <>
      {/* Sunlight from above */}
      <directionalLight position={[0, 50, 50]} intensity={1.5} color={0xaaccff} />
      <ambientLight intensity={0.3} />
    </>
  );
}

function FogEffect() {
  const { scene } = useThree();
  useEffect(() => {
    // Blue fog for underwater effect
    scene.fog = new THREE.Fog(0x1e5d88, 15, 80);
    scene.background = new THREE.Color(0x1e5d88);
  }, [scene]);
  return null;
}

function DynamicFog() {
  const { scene, camera } = useThree();
  useFrame(() => {
    const depthFactor = THREE.MathUtils.clamp((-camera.position.y) / 60, 0, 1);
    scene.fog.far = THREE.MathUtils.lerp(80, 30, depthFactor);
    scene.fog.near = THREE.MathUtils.lerp(15, 5, depthFactor);
  });
  return null;
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
      camera={{ position: [0, 10, 30], fov: 30 }}
    >
      <FogEffect />
      <DynamicFog />
      <ScrollCamera topY={10} bottomY={-65} />
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
        position={[0, -65, 0]}
        color={0x8B7D5B}
        noiseScale={0.15}
        noiseStrength={1.3}
      />
    </Canvas>
  );
}
