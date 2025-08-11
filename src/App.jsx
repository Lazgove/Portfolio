import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D reflectionTexture;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 reflectedColor = texture2D(reflectionTexture, uv);
    gl_FragColor = reflectedColor;
  }
`;

function WaterPlane({ debugVisible = false }) {
  const { gl, scene, camera, size } = useThree();
  const reflectionFBO = useFBO(size.width, size.height);
  const reflectionCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const meshRef = useRef();

  const material = useMemo(() => {
    if (debugVisible) {
      // Simple visible material for debugging
      return new THREE.MeshStandardMaterial({ color: 'blue', wireframe: false, opacity: 0.6, transparent: true });
    }
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        reflectionTexture: { value: null },
      },
      transparent: true,
    });
  }, [debugVisible]);

  useFrame(() => {
    if (debugVisible) return; // Skip reflection render pass if debugging

    reflectionCamera.position.copy(camera.position);
    reflectionCamera.position.y *= -1;

    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);

    reflectionCamera.up.set(0, -1, 0);
    reflectionCamera.lookAt(
      new THREE.Vector3(
        camera.position.x + lookDirection.x,
        -camera.position.y + lookDirection.y,
        camera.position.z + lookDirection.z
      )
    );

    reflectionCamera.far = camera.far;
    reflectionCamera.near = camera.near;
    reflectionCamera.aspect = camera.aspect;
    reflectionCamera.updateProjectionMatrix();
    reflectionCamera.updateMatrixWorld();

    meshRef.current.visible = false;

    gl.setRenderTarget(reflectionFBO);
    gl.clear();
    gl.render(scene, reflectionCamera);

    gl.setRenderTarget(null);

    meshRef.current.visible = true;

    material.uniforms.reflectionTexture.value = reflectionFBO.texture;
  });

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      ref={meshRef}
      material={material}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[10, 10]} />
    </mesh>
  );
}

function Box() {
  return (
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        body, html, #root {
          margin: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background: #88ccff;
        }
        canvas {
          display: block;
        }
      `}</style>
      <Canvas
        shadows
        camera={{ position: [0, 3, 8], fov: 50 }}
        style={{ height: '100vh', width: '100vw' }}
      >
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        {/* Objects */}
        <Box />
        {/* Water plane: set debugVisible to true to test visibility */}
        <WaterPlane debugVisible={false} />
      </Canvas>
    </>
  );
}
