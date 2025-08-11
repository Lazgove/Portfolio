// App.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';

// Shaders (same as before)
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

function WaterPlane() {
  const { gl, scene, camera, size } = useThree();
  const reflectionFBO = useFBO(size.width, size.height);
  const reflectionCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        reflectionTexture: { value: null },
      },
      transparent: true,
    });
  }, []);

  useFrame(() => {
    // Mirror camera position over water plane (y=0)
    reflectionCamera.position.copy(camera.position);
    reflectionCamera.position.y *= -1;

    // Mirror camera look direction
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

    // Hide water plane during reflection render to avoid feedback loop
    meshRef.current.visible = false;

    gl.setRenderTarget(reflectionFBO);
    gl.clear();
    gl.render(scene, reflectionCamera);

    gl.setRenderTarget(null);

    // Show water plane again
    meshRef.current.visible = true;

    // Update shader uniform
    material.uniforms.reflectionTexture.value = reflectionFBO.texture;
  });

  // DEBUG: uncomment below to show a simple visible plane (replace shader)
  // return (
  //   <mesh rotation-x={-Math.PI / 2} ref={meshRef} position={[0, 0, 0]}>
  //     <planeGeometry args={[10, 10]} />
  //     <meshStandardMaterial color="blue" wireframe />
  //   </mesh>
  // );

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
    <mesh position={[0, 1, 0]}>
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
        }
        canvas {
          display: block;
        }
      `}</style>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        style={{ height: '100vh', width: '100vw' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Box />
        <WaterPlane />
      </Canvas>
    </>
  );
}
