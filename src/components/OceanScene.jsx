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
  const { camera } = useThree();

  useFrame(() => {
    if (dirLightRef.current) {
      const depthFactor = camera.position.y > 0 ? 0 : THREE.MathUtils.clamp((-camera.position.y) / 75, 0, 1);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(1.5, 0.3, depthFactor);
    }
  });

  return (
    <>
      <directionalLight ref={dirLightRef} position={[0, 50, 50]} intensity={1.5} color={0xaaccff} />
      <ambientLight intensity={0.3} />
    </>
  );
}

function FogAndSkySwitcher() {
  const { scene, camera } = useThree();

  const fogStart = 1;  // Start of fog fade (just above water)
  const fogEnd = -1;   // Full fog at this depth and below

  useEffect(() => {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = null;
  }, [scene]);

  useFrame(() => {
    const y = camera.position.y;

    if (y >= fogStart) {
      // Fully above water
      scene.background.set(0x87ceeb);
      scene.fog = null;
    } else if (y <= fogEnd) {
      // Fully underwater
      scene.background.set(0x1e5d88);
      if (!scene.fog) {
        scene.fog = new THREE.Fog(0x1e5d88, 15, 80);
      }
    } else {
      // Transition zone - smoothly blend fog and background color
      const t = (fogStart - y) / (fogStart - fogEnd); // 0 at fogStart, 1 at fogEnd

      const aboveColor = new THREE.Color(0x87ceeb);
      const belowColor = new THREE.Color(0x1e5d88);
      const bgColor = aboveColor.clone().lerp(belowColor, t);
      scene.background.copy(bgColor);

      if (!scene.fog) {
        scene.fog = new THREE.Fog(0x1e5d88, 15, 80);
      }

      const fogColor = aboveColor.clone().lerp(belowColor, t);
      scene.fog.color.copy(fogColor);
    }
  });

  return null;
}

function DynamicFog() {
  const { scene, camera } = useThree();

  const fogEnd = -1;

  useFrame(() => {
    if (camera.position.y <= fogEnd && scene.fog) {
      const depthFactor = THREE.MathUtils.clamp((-camera.position.y) / 75, 0, 1);

      scene.fog.far = THREE.MathUtils.lerp(80, 30, depthFactor);
      scene.fog.near = THREE.MathUtils.lerp(15, 5, depthFactor);

      const baseColor = new THREE.Color(0x1e5d88);
      const darkenedColor = baseColor.clone().lerp(new THREE.Color(0x000000), depthFactor * 0.8);
      scene.fog.color.copy(darkenedColor);

      scene.background.copy(darkenedColor);
    }
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
      <DynamicFog />
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
