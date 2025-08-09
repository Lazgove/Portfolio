import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';

function AnimatedNoisyWaterPlane({ position, color, size = 500, noiseScale = 0.5, noiseStrength = 1 }) {
  const meshRef = useRef();

  // Custom shader with vertex displacement and fresnel effect
  const vertexShader = `
    uniform float time;
    uniform float noiseScale;
    uniform float noiseStrength;

    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vViewDir;

    void main() {
      vec3 pos = position;

      // Waves
      float wave1 = sin(pos.x * noiseScale + time * 0.8);
      float wave2 = cos(pos.y * noiseScale * 1.3 + time * 1.2);
      float wave3 = sin((pos.x + pos.y) * noiseScale * 0.7 + time * 0.5);

      float wave = wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.2;
      pos.z += wave * noiseStrength;

      vPos = pos;

      // Approximate normals by finite difference
      float eps = 0.001;
      float wave_dx = (sin((pos.x + eps) * noiseScale + time * 0.8) * 0.6
                     + cos(pos.y * noiseScale * 1.3 + time * 1.2) * 0.3
                     + sin(((pos.x + eps) + pos.y) * noiseScale * 0.7 + time * 0.5) * 0.2);
      float wave_dy = (sin(pos.x * noiseScale + time * 0.8) * 0.6
                     + cos((pos.y + eps) * noiseScale * 1.3 + time * 1.2) * 0.3
                     + sin((pos.x + (pos.y + eps)) * noiseScale * 0.7 + time * 0.5) * 0.2);

      vec3 tangentX = normalize(vec3(eps, 0.0, (wave_dx - wave) * noiseStrength));
      vec3 tangentY = normalize(vec3(0.0, eps, (wave_dy - wave) * noiseStrength));
      vNormal = normalize(cross(tangentY, tangentX));

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewDir = normalize(-mvPosition.xyz);

      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 color;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 3.0);
      vec3 waterColor = color;
      vec3 highlight = vec3(0.8, 0.9, 1.0);
      vec3 finalColor = mix(waterColor, highlight, fresnel);
      gl_FragColor = vec4(finalColor, 0.8);
    }
  `;

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    noiseScale: { value: noiseScale },
    noiseStrength: { value: noiseStrength },
    color: { value: new THREE.Color(color) },
  }), [noiseScale, noiseStrength, color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    uniforms.time.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <planeGeometry args={[size, size, 200, 200]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
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
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function ScrollCamera({ topY = 10, bottomY = -100 }) {
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
    if (!dirLightRef.current) return;
    const depthFactor = camera.position.y > 0 ? 0 : THREE.MathUtils.clamp((-camera.position.y) / 100, 0, 1);
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
    const fogFactor = THREE.MathUtils.clamp((10 - y) / 110, 0, 1); // Note: range adjusted for -100 ground

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

// Water surface lens thickness effect at y=0
function WaterSurfaceLens({ cameraY, thickness = 2, size = 500 }) {
  const meshRef = useRef();

  const uniforms = useMemo(() => ({
    cameraY: { value: cameraY },
    thickness: { value: thickness },
    opacity: { value: 0.3 },
  }), [cameraY, thickness]);

  useFrame(() => {
    if (meshRef.current) {
      uniforms.cameraY.value = cameraY;
    }
  });

  const vertexShader = `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float cameraY;
    uniform float thickness;
    uniform float opacity;

    varying vec3 vPosition;

    void main() {
      float dist = abs(cameraY);
      float edgeFactor = smoothstep(thickness, 0.0, dist);

      vec3 waterColor = vec3(0.1, 0.4, 0.7);
      gl_FragColor = vec4(waterColor, opacity * edgeFactor);
    }
  `;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Wrapper to track camera Y and pass to WaterSurfaceLens
function WaterSurfaceLensWrapper() {
  const { camera } = useThree();
  const [camY, setCamY] = useState(camera.position.y);

  useFrame(() => {
    setCamY(camera.position.y);
  });

  return <WaterSurfaceLens cameraY={camY} />;
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
      <ScrollCamera topY={10} bottomY={-100} />
      <Lights />

      {/* Water surface */}
      <AnimatedNoisyWaterPlane
        position={[0, 0, 0]}
        color={0x3fa9f5}
        noiseScale={0.3}
        noiseStrength={0.4}
      />

      {/* Sandy ground */}
      <StaticNoisyPlane
        position={[0, -100, 0]}
        color={0x8B7D5B}
        noiseScale={0.15}
        noiseStrength={1.3}
      />

      {/* Thin water surface thickness layer */}
      <WaterSurfaceLensWrapper />
    </Canvas>
  );
}
