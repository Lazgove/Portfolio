import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';

// Scroll-controlled camera moving vertically
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

// Fog and background color transition based on camera height
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

// Static noisy ground plane
function StaticNoisyPlane({ position, color, size = 500, noiseScale = 0.15, noiseStrength = 1.3 }) {
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
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

// Water surface with animated waves and dynamic lighting from sun
function WaterSurface({ position, size = 500, dirLight }) {
  const meshRef = useRef();

  // Load water normal texture from Three.js example repo
  const normalMap = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('https://threejs.org/examples/textures/waternormals.jpg');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    normalMap: { value: normalMap },
    waterColor: { value: new THREE.Color(0x3fa9f5) },
    lightDirection: { value: new THREE.Vector3(0, 1, 0) },
  }), [normalMap]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();

    if (dirLight?.current) {
      // Directional light direction points from light position toward origin (negated normalized)
      const lightDir = new THREE.Vector3();
      lightDir.copy(dirLight.current.position).normalize().negate();
      uniforms.lightDirection.value.copy(lightDir);
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform sampler2D normalMap;
    uniform vec3 waterColor;
    uniform vec3 lightDirection;

    varying vec2 vUv;
    varying vec3 vPos;

    void main() {
      vec2 uv1 = vUv + vec2(time * 0.1, time * 0.1);
      vec2 uv2 = vUv - vec2(time * 0.15, time * 0.12);

      vec3 normal1 = texture2D(normalMap, uv1).rgb;
      vec3 normal2 = texture2D(normalMap, uv2).rgb;

      vec3 normal = normalize(normal1 * 2.0 - 1.0 + normal2 * 2.0 - 1.0);

      float lightIntensity = max(dot(normal, lightDirection), 0.0);

      float fresnel = pow(1.0 - dot(normalize(vec3(0.0, 1.0, 0.0)), normalize(vPos)), 3.0);

      vec3 color = waterColor * lightIntensity + vec3(1.0) * fresnel * 0.3;

      gl_FragColor = vec4(color, 0.8);
    }
  `;

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[size, size, 100, 100]} />
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

export default function OceanScene() {
  const dirLightRef = useRef();

  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 30], fov: 30, near: 0.5, far: 1000 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <FogAndSkySwitcher />
      <ScrollCamera topY={10} bottomY={-95} />

      {/* Sunlight */}
      <directionalLight
        ref={dirLightRef}
        position={[50, 100, 50]}
        intensity={1.5}
        color={0xfff7e8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Water surface with dynamic lighting */}
      <WaterSurface position={[0, 0, 0]} size={500} dirLight={dirLightRef} />

      {/* Sandy ground far below */}
      <StaticNoisyPlane position={[0, -100, 0]} color={0x8B7D5B} />
    </Canvas>
  );
}
