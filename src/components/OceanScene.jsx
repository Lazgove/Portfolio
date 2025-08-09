import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';

// Animated water surface with waves
function AnimatedNoisyPlane({ position, color, size = 500, noiseScale = 0.5, noiseStrength = 1 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const geometry = meshRef.current.geometry;
    const positionAttr = geometry.attributes.position;

    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);

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
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
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

// Static sandy ground with noise
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
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

// Scroll-controlled camera movement
function ScrollCamera({ topY = 10, bottomY = -95 }) {
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

// Directional light dims as camera goes underwater
function Lights() {
  const dirLightRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!dirLightRef.current) return;

    const depthFactor = camera.position.y > 0 ? 0 : THREE.MathUtils.clamp((-camera.position.y) / 95, 0, 1);
    dirLightRef.current.intensity = THREE.MathUtils.lerp(1.5, 0.3, depthFactor);
  });

  return (
    <>
      <directionalLight
        ref={dirLightRef}
        position={[0, 50, 50]}
        intensity={1.5}
        color={0xaaccff}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <ambientLight intensity={0.3} />
    </>
  );
}

// Fog and sky color switcher based on camera depth
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
    const fogFactor = THREE.MathUtils.clamp((10 - y) / 95, 0, 1);

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

// Light rays from above fading with depth
function LightRays({ count = 6, radius = 30, height = 50 }) {
  const { camera } = useThree();
  const groupRef = useRef();

  const coneGeometry = useMemo(() => {
    return new THREE.ConeGeometry(radius * 0.3, height, 20, 1, true);
  }, [radius, height]);

  const gradientTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

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
      child.material.opacity = depthFactor * 0.3;
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
            renderOrder={10}
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

// Main ocean scene component
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

      {/* Water surface */}
      <AnimatedNoisyPlane
        position={[0, 0, 0]}
        color={0x3fa9f5}
        noiseScale={0.3}
        noiseStrength={0.4}
      />

      {/* Sandy ground */}
      <StaticNoisyPlane
        position={[0, -100, 0]}
        color={0x8b7d5b}
        noiseScale={0.15}
        noiseStrength={1.3}
      />

      {/* Light rays */}
      <LightRays count={8} radius={40} height={60} />
    </Canvas>
  );
}
