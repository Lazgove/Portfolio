import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// Import the repo’s shader strings:
import { waterVertexShader } from '../shaders/waterVertexShader.js';
import { waterFragmentShader } from '../shaders/waterFragmentShader.js';

// Create a ShaderMaterial with the repo shaders, no textures:
const WaterMaterial = shaderMaterial(
  {
    time: 0,
    cameraPosition: new THREE.Vector3(),
  },
  waterVertexShader,
  waterFragmentShader
);

extend({ WaterMaterial });

export default function WaterPlane({ position = [0, 0, 0], size = 500 }) {
  const ref = useRef();

  useFrame(({ clock, camera }) => {
    if (ref.current) {
      ref.current.uniforms.time.value = clock.getElapsedTime();
      ref.current.uniforms.cameraPosition.value.copy(camera.position);
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[size, size, 200, 200]} />
      <waterMaterial ref={ref} />
    </mesh>
  );
}
