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

      // Layered sine waves for natural wave-like surface
      const wave1 = Math.sin(x * noiseScale + time * 0.8);
      const wave2 = Math.cos(y * noiseScale * 1.3 + time * 1.2);
      const wave3 = Math.sin((x + y) * noiseScale * 0.7 + time * 0.5);

      const wave = wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.2;

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

function ScrollCamera({ topY = 10, bottomY = -75 }) {
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
  const dirLightRef = useRef();
  const causticLightRef = useRef();
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!dirLightRef.current || !causticLightRef.current) return;

    const depthFactor = camera.position.y > 0 ? 0 : THREE.MathUtils.clamp((-camera.position.y) / 75, 0, 1);

    // Dim the main directional light as we go underwater
    dirLightRef.current.intensity = THREE.MathUtils.lerp(1.5, 0.3, depthFactor);

    // Animate caustic light intensity and subtle movement to mimic wave caustics
    const time = clock.getElapsedTime();
    causticLightRef.current.intensity = THREE.MathUtils.lerp(0, 0.5, depthFactor);

    // Oscillate the position slightly using sine waves (simulate light movement)
    causticLightRef.current.position.x = Math.sin(time * 1.5) * 10;
    causticLightRef.current.position.z = Math.cos(time * 1.2) * 10;
  });

  return (
    <>
      <directionalLight
        ref={dirLightRef}
        position={[0, 50, 50]}
        intensity={1.5}
        color={0xaaccff}
        castShadow
      />
      <ambientLight intensity={0.3} />

      {/* Underwater caustic light */}
      <directionalLight
        ref={causticLightRef}
        position={[0, -10, 0]}
        intensity={0}
        color={0x77aaff}
        castShadow={false}
      />
    </>
  );
}

function FogAndSkySwitcher() {
  const { scene, camera } = useThree();

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(0x87ceeb, 50, 100);
    }
    scene.background = new THREE.Color(0x87ceeb);
  }, [scene]);

  useFrame(() => {
    const y = camera.position.y;
    const fogFactor = THREE.MathUtils.clamp((10 - y) / 85, 0, 1);

    const skyColor = new THREE.Color(0x87ceeb);
    const deepColor = new THREE.Color(0x1e5d88);
    const bgColor = skyColor.clone().lerp(deepColor, fogFactor);
    scene.background.copy(bgColor);

    const fogColor = skyColor.clone().lerp(deepColor, fogFactor);
    scene.fog.color.copy(fogColor);

    scene.fog.near = THREE.MathUtils.lerp(50, 5, fogFactor);
    scene.fog.far = THREE.MathUtils.lerp(100, 30, fogFactor);
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
      <FogAndSkySwitcher />
      <ScrollCamera topY={10} bottomY={-75} />
      <Lights />

      {/* Water surface */}
      <AnimatedNoisyPlane
        position={[0, 0, 0]}
        color={0x3fa9f5}
        noiseScale={0.3}
        noiseStrength={0.4}
      />

      {/* Sandy ground (lowered) */}
      <StaticNoisyPlane
        position={[0, -75, 0]}
        color={0x8B7D5B}
        noiseScale={0.15}
        noiseStrength={1.3}
      />
    </Canvas>
  );
}
