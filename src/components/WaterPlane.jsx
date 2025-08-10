import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

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
