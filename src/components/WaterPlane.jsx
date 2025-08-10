import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { waterVertexShader } from '../shaders/waterVertexShader.js';
import { waterFragmentShader } from '../shaders/waterFragmentShader.js';

const WaterMaterial = shaderMaterial(
  {
    time: 0,
    reflectionTexture: null,
    refractionTexture: null,
    normalMap: null,
    cameraPosition: new THREE.Vector3(),
  },
  waterVertexShader,
  waterFragmentShader
);

extend({ WaterMaterial });

export default function WaterPlane({ position = [0, 0, 0], size = 500, reflectionTexture, refractionTexture, normalMap }) {
  const ref = useRef();

  useFrame(({ clock, camera }) => {
    if (ref.current) {
      ref.current.uniforms.time.value = clock.getElapsedTime();
      ref.current.uniforms.cameraPosition.value.copy(camera.position);
      ref.current.uniforms.reflectionTexture.value = reflectionTexture;
      ref.current.uniforms.refractionTexture.value = refractionTexture;
      ref.current.uniforms.normalMap.value = normalMap;
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[size, size, 200, 200]} />
      <waterMaterial ref={ref} />
    </mesh>
  );
}
