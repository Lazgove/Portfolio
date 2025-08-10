// OceanScene.jsx
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';

// ====== GLSL Shaders (copied verbatim from repo) ======

const dropFragmentShader = `
uniform vec2 center;
uniform float radius;
uniform float strength;
uniform sampler2D texture;

varying vec2 vUv;

void main() {
  vec4 info = texture2D(texture, vUv);
  float drop = max(0.0, 1.0 - length(vUv - center) / radius);
  drop = 0.5 - cos(drop * 3.14159265358979323846) * 0.5;
  info.r += drop * strength;
  gl_FragColor = info;
}
`;

const normalFragmentShader = `
uniform sampler2D texture;
uniform float texelSize;

varying vec2 vUv;

void main() {
  float L = texture2D(texture, vUv - vec2(texelSize, 0)).r;
  float R = texture2D(texture, vUv + vec2(texelSize, 0)).r;
  float T = texture2D(texture, vUv + vec2(0, texelSize)).r;
  float B = texture2D(texture, vUv - vec2(0, texelSize)).r;

  vec3 normal = normalize(vec3(L - R, 2.0 * texelSize, B - T));
  normal = normal * 0.5 + 0.5;
  gl_FragColor = vec4(normal, 1.0);
}
`;

const waterVertexShader = `
uniform sampler2D normalMap;
uniform float time;

varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  vec3 normalTex = texture2D(normalMap, uv).rgb;
  vec3 normal = normalize(normalTex * 2.0 - 1.0);

  pos.z += normal.r * 0.15;

  vPos = pos;
  vNormal = normal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = `
uniform vec3 color;
uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vPos;
varying vec2 vUv;

void main() {
  float light = max(dot(normalize(vNormal), normalize(lightDirection)), 0.0);
  vec3 baseColor = color;
  vec3 finalColor = baseColor * light;

  gl_FragColor = vec4(finalColor, 0.8);
}
`;

// ====== WaterSurface component implementing full simulation ======

function WaterSurface({ size = 512 }) {
  const meshRef = useRef();
  const { gl } = useThree();

  // Create two ping-pong render targets for simulation
  const [simRT1] = useState(() =>
    new THREE.WebGLRenderTarget(size, size, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    }),
  );
  const [simRT2] = useState(() =>
    simRT1.clone(),
  );

  // Normal map render target
  const [normalRT] = useState(() =>
    new THREE.WebGLRenderTarget(size, size, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    }),
  );

  // Keep track of which RT is the current simulation state
  const simWriteRef = useRef(simRT1);
  const simReadRef = useRef(simRT2);

  // Setup scenes and cameras for simulation passes
  const simScene = useRef(new THREE.Scene());
  const simCamera = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));

  // A fullscreen quad geometry for simulation passes
  const simQuad = useRef(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null));

  useEffect(() => {
    simScene.current.add(simQuad.current);
  }, []);

  // --- Simulation materials ---

  // Drop material to add ripples on demand
  const dropUniforms = useRef({
    center: { value: new THREE.Vector2(0.5, 0.5) },
    radius: { value: 0.03 },
    strength: { value: 0.5 },
    texture: { value: null },
  });

  const dropMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: dropUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: dropFragmentShader,
    }),
  );

  // Simulation update material — performs ripple physics iteration
  const updateUniforms = useRef({
    texture: { value: null },
    delta: { value: 0.016 },
  });

  const updateMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: updateUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D texture;
        uniform float delta;

        varying vec2 vUv;

        void main() {
          vec2 texel = vec2(1.0 / ${size}.0, 1.0 / ${size}.0);

          float up = texture2D(texture, vUv + vec2(0.0, texel.y)).r;
          float down = texture2D(texture, vUv - vec2(0.0, texel.y)).r;
          float left = texture2D(texture, vUv - vec2(texel.x, 0.0)).r;
          float right = texture2D(texture, vUv + vec2(texel.x, 0.0)).r;

          float center = texture2D(texture, vUv).r;

          float laplacian = (up + down + left + right - 4.0 * center);

          float velocity = texture2D(texture, vUv).g;

          velocity += laplacian * 0.5;
          velocity *= 0.995;

          float height = center + velocity * delta;

          gl_FragColor = vec4(height, velocity, 0.0, 1.0);
        }
      `,
    }),
  );

  // Normal map calculation material
  const normalUniforms = useRef({
    texture: { value: null },
    texelSize: { value: 1 / size },
  });

  const normalMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: normalUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: normalFragmentShader,
    }),
  );

  // Water surface shader material
  const waterUniforms = useRef({
    normalMap: { value: null },
    time: { value: 0 },
    color: { value: new THREE.Color(0x3fa9f5) },
    lightDirection: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
  });

  const waterMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: waterUniforms.current,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );

  // --- Helper function to swap simulation render targets ---
  const swapRT = () => {
    const temp = simReadRef.current;
    simReadRef.current = simWriteRef.current;
    simWriteRef.current = temp;
  };

  // --- Inject drops at random positions periodically ---
  useEffect(() => {
    const interval = setInterval(() => {
      dropUniforms.current.center.value.set(Math.random(), Math.random());
      dropUniforms.current.radius.value = 0.03 + Math.random() * 0.02;
      dropUniforms.current.strength.value = 0.3 + Math.random() * 0.5;

      dropUniforms.current.texture.value = simReadRef.current.texture;

      simQuad.current.material = dropMaterial.current;

      gl.setRenderTarget(simWriteRef.current);
      gl.render(simScene.current, simCamera.current);
      gl.setRenderTarget(null);

      swapRT();

      dropUniforms.current.texture.value = null;
    }, 4000);

    return () => clearInterval(interval);
  }, [gl]);

  // --- Main simulation loop ---
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 1. Update simulation (ripple physics)
    updateUniforms.current.texture.value = simReadRef.current.texture;
    simQuad.current.material = updateMaterial.current;

    gl.setRenderTarget(simWriteRef.current);
    gl.render(simScene.current, simCamera.current);
    gl.setRenderTarget(null);

    swapRT();

    // 2. Calculate normal map from height map
    normalUniforms.current.texture.value = simReadRef.current.texture;
    simQuad.current.material = normalMaterial.current;

    gl.setRenderTarget(normalRT);
    gl.render(simScene.current, simCamera.current);
    gl.setRenderTarget(null);

    // 3. Update water material uniform
    waterUniforms.current.normalMap.value = normalRT.texture;
    waterUniforms.current.time.value = time;
  });

  // --- Mesh setup ---
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} material={waterMaterial.current}>
      <planeGeometry args={[10, 10, 256, 256]} />
    </mesh>
  );
}

// ===== Other scene components =====

// Ground plane (simple)
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#8B7D5B" roughness={1} metalness={0} />
    </mesh>
  );
}

// Scroll camera moves Y between topY and bottomY
function ScrollCamera({ topY = 2, bottomY = -2 }) {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
    camera.position.y = THREE.MathUtils.lerp(topY, bottomY, progress);
    camera.position.z = 5;
    camera.position.x = 0;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Lighting
function Lights() {
  const dirLight = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!dirLight.current) return;
    const depthFactor = camera.position.y > 0 ? 0 : THREE.MathUtils.clamp((-camera.position.y) / 10, 0, 1);
    dirLight.current.intensity = THREE.MathUtils.lerp(1.5, 0.3, depthFactor);
  });

  return (
    <>
      <directionalLight
        ref={dirLight}
        position={[10, 20, 10]}
        intensity={1.5}
        color={0xaaccff}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={0.3} />
    </>
  );
}

// Fog and background color based on camera height
function FogAndSkySwitcher() {
  const { scene, camera } = useThree();

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(0x87ceeb, 5, 20);
    }
    scene.background = new THREE.Color(0x87ceeb);
  }, [scene]);

  useFrame(() => {
    const y = camera.position.y;
    const fogFactor = THREE.MathUtils.clamp((2 - y) / 10, 0, 1);
    const skyColor = new THREE.Color(0x87ceeb);
    const deepColor = new THREE.Color(0x1e5d88);
    const bgColor = skyColor.clone().lerp(deepColor, fogFactor);
    scene.background.copy(bgColor);
    scene.fog.color.copy(bgColor);
    scene.fog.near = THREE.MathUtils.lerp(5, 2, fogFactor);
    scene.fog.far = THREE.MathUtils.lerp(20, 10, fogFactor);
  });

  return null;
}

// ===== Exported OceanScene =====
export default function OceanScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 45, near: 0.1, far: 100 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <FogAndSkySwitcher />
      <ScrollCamera topY={2} bottomY={-2} />
      <Lights />
      <GroundPlane />
      <WaterSurface />
    </Canvas>
  );
}
