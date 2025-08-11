// App.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D reflectionTexture;
  varying vec2 vUv;
  
  void main() {
    // Sample the reflection texture with flipped Y (framebuffer coords)
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 reflectedColor = texture2D(reflectionTexture, uv);
    gl_FragColor = reflectedColor;
  }
`;

// Component to render the reflection framebuffer and the water plane
function WaterPlane() {
  const { gl, scene, camera, size } = useThree();
  const reflectionFBO = useFBO(size.width, size.height);

  // Create a reflection camera by mirroring main camera on the water plane (y=0)
  const reflectionCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera();
    return cam;
  }, []);

  // Shader material for the water plane, using the reflection texture
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

  const meshRef = useRef();

  useFrame(() => {
    // Mirror camera position over water plane (y=0)
    reflectionCamera.position.copy(camera.position);
    reflectionCamera.position.y *= -1;

    // Mirror camera look direction
    reflectionCamera.up.set(0, -1, 0);
    reflectionCamera.lookAt(
      new THREE.Vector3(
        camera.position.x + camera.getWorldDirection(new THREE.Vector3()).x,
        -camera.position.y + camera.getWorldDirection(new THREE.Vector3()).y,
        camera.position.z + camera.getWorldDirection(new THREE.Vector3()).z
      )
    );

    reflectionCamera.far = camera.far;
    reflectionCamera.near = camera.near;
    reflectionCamera.aspect = camera.aspect;
    reflectionCamera.updateProjectionMatrix();
    reflectionCamera.updateMatrixWorld();

    // Render scene from reflection camera to framebuffer
    gl.setRenderTarget(reflectionFBO);
    gl.clear();
    gl.render(scene, reflectionCamera);
    gl.setRenderTarget(null);

    // Update material uniform with reflection texture
    material.uniforms.reflectionTexture.value = reflectionFBO.texture;
  });

  return (
    <mesh rotation-x={-Math.PI / 2} ref={meshRef} material={material}>
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
    <Canvas camera={{ position: [0, 3, 5], fov: 50 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <Box />
      <WaterPlane />
    </Canvas>
  );
}
