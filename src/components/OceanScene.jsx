import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// GLSL Shaders embedded as strings (taken from the repo)
const simulationFragmentShader = `
precision highp float;
uniform sampler2D texture;
uniform vec2 delta;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  float center = texture2D(texture, uv).r;

  float up = texture2D(texture, uv + vec2(0.0, delta.y)).r;
  float down = texture2D(texture, uv - vec2(0.0, delta.y)).r;
  float left = texture2D(texture, uv - vec2(delta.x, 0.0)).r;
  float right = texture2D(texture, uv + vec2(delta.x, 0.0)).r;

  float newHeight = (up + down + left + right) * 0.5 - center;
  newHeight *= 0.995; // damping

  gl_FragColor = vec4(newHeight, 0.0, 0.0, 1.0);
}
`;

const dropFragmentShader = `
precision highp float;
uniform sampler2D texture;
uniform vec2 center;
uniform float radius;
uniform float strength;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float current = texture2D(texture, uv).r;

  float dist = distance(uv, center);
  if(dist < radius) {
    float drop = cos(dist / radius * 3.14159) * strength;
    current += drop;
  }

  gl_FragColor = vec4(current, 0.0, 0.0, 1.0);
}
`;

const normalFragmentShader = `
precision highp float;
uniform sampler2D texture;
uniform vec2 delta;
varying vec2 vUv;

void main() {
  float heightL = texture2D(texture, vUv - vec2(delta.x, 0.0)).r;
  float heightR = texture2D(texture, vUv + vec2(delta.x, 0.0)).r;
  float heightD = texture2D(texture, vUv - vec2(0.0, delta.y)).r;
  float heightU = texture2D(texture, vUv + vec2(0.0, delta.y)).r;

  vec3 normal = normalize(vec3(heightL - heightR, 2.0, heightD - heightU));

  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
`;

const waterVertexShader = `
varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D heightMap;
uniform float time;

void main() {
  vUv = uv;
  vPos = position;

  float height = texture2D(heightMap, uv).r;
  vec3 pos = position + normal * height * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = `
precision highp float;
varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D normalMap;
uniform vec3 lightDir;

void main() {
  vec3 normal = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  float light = dot(normalize(lightDir), normalize(normal));
  vec3 baseColor = vec3(0.0, 0.4, 0.7);
  vec3 color = baseColor * light + baseColor * 0.3;
  gl_FragColor = vec4(color, 0.8);
}
`;

// Full WaterSurface component encapsulates simulation logic
function WaterSurface({ size = 10, segments = 256 }) {
  const meshRef = useRef();
  const simScene = useRef();
  const simCamera = useRef();
  const simQuad = useRef();

  const simRT1 = useRef();
  const simRT2 = useRef();
  const normalRT = useRef();

  const simulationMaterial = useRef();
  const dropMaterial = useRef();
  const normalMaterial = useRef();
  const waterMaterial = useRef();

  const simWriteRef = useRef();
  const simReadRef = useRef();

  const dropUniforms = useRef({
    center: { value: new THREE.Vector2() },
    radius: { value: 0.05 },
    strength: { value: 0.5 },
    texture: { value: null },
  });

  const simulationUniforms = useRef({
    texture: { value: null },
    delta: { value: new THREE.Vector2(1 / segments, 1 / segments) },
  });

  const normalUniforms = useRef({
    texture: { value: null },
    delta: { value: new THREE.Vector2(1 / segments, 1 / segments) },
  });

  const waterUniforms = useRef({
    heightMap: { value: null },
    normalMap: { value: null },
    time: { value: 0 },
    lightDir: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
  });

  const { gl } = useThree();

  // Initialize render targets and materials
  useEffect(() => {
    simRT1.current = new THREE.WebGLRenderTarget(segments, segments, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });

    simRT2.current = simRT1.current.clone();
    normalRT.current = simRT1.current.clone();

    simWriteRef.current = simRT1.current;
    simReadRef.current = simRT2.current;

    simScene.current = new THREE.Scene();
    simCamera.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Geometry for simulation full screen quad
    const simGeometry = new THREE.PlaneGeometry(2, 2);
    simQuad.current = new THREE.Mesh(simGeometry, null);
    simScene.current.add(simQuad.current);

    // Simulation material (wave propagation)
    simulationMaterial.current = new THREE.ShaderMaterial({
      uniforms: simulationUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
      `,
      fragmentShader: simulationFragmentShader,
    });

    // Drop material (inject ripple)
    dropMaterial.current = new THREE.ShaderMaterial({
      uniforms: dropUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
      `,
      fragmentShader: dropFragmentShader,
    });

    // Normal map calculation
    normalMaterial.current = new THREE.ShaderMaterial({
      uniforms: normalUniforms.current,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
      `,
      fragmentShader: normalFragmentShader,
    });

    // Water surface material
    waterMaterial.current = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: waterUniforms.current,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Initialize simulation with zero data
    const zeroData = new Float32Array(segments * segments * 4);
    const zeroTexture = new THREE.DataTexture(
      zeroData,
      segments,
      segments,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    zeroTexture.needsUpdate = true;

    gl.setRenderTarget(simRT1.current);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(true, true, true);
    gl.setRenderTarget(simRT2.current);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(true, true, true);
    gl.setRenderTarget(null);
  }, [gl, segments]);

  // Swap ping-pong RTs helper
  function swapRT() {
    const temp = simWriteRef.current;
    simWriteRef.current = simReadRef.current;
    simReadRef.current = temp;

    simulationUniforms.current.texture.value = simReadRef.current.texture;
    dropUniforms.current.texture.value = simReadRef.current.texture;
    normalUniforms.current.texture.value = simReadRef.current.texture;
  }

  // Inject a drop (ripple) at given uv coords
  function addDrop(uvX, uvY, radius = 0.05, strength = 0.6) {
    dropUniforms.current.center.value.set(uvX, uvY);
    dropUniforms.current.radius.value = radius;
    dropUniforms.current.strength.value = strength;
    dropUniforms.current.texture.value = simReadRef.current.texture;

    simQuad.current.material = dropMaterial.current;
    gl.setRenderTarget(simWriteRef.current);
    gl.render(simScene.current, simCamera.current);
    gl.setRenderTarget(null);

    swapRT();

    dropUniforms.current.texture.value = null;
  }

  // Animate simulation each frame
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 1. Simulation pass - wave propagation
    simulationUniforms.current.texture.value = simReadRef.current.texture;
    simQuad.current.material = simulationMaterial.current;
    gl.setRenderTarget(simWriteRef.current);
    gl.render(simScene.current, simCamera.current);
    gl.setRenderTarget(null);

    swapRT();

    // 2. Normal map calculation pass
    normalUniforms.current.texture.value = simReadRef.current.texture;
    simQuad.current.material = normalMaterial.current;
    gl.setRenderTarget(normalRT.current);
    gl.render(simScene.current, simCamera.current);
    gl.setRenderTarget(null);

    // 3. Update water material uniforms
    waterUniforms.current.heightMap.value = simReadRef.current.texture;
    waterUniforms.current.normalMap.value = normalRT.current.texture;
    waterUniforms.current.time.value = time;

    // Optional: Add periodic drops automatically
    if (Math.floor(time) % 4 === 0) {
      const uvX = 0.3 + 0.4 * Math.sin(time * 1.5);
      const uvY = 0.3 + 0.4 * Math.cos(time * 1.5);
      addDrop(uvX, uvY, 0.06, 0.8);
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={new THREE.PlaneGeometry(size, size, segments, segments)}
      material={waterMaterial.current}
      frustumCulled={false}
    />
  );
}

// Main Canvas wrapper
export default function OceanScene() {
  return (
    <Canvas
      camera={{ position: [0, 5, 5], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x202840));
      }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <WaterSurface />
    </Canvas>
  );
}
