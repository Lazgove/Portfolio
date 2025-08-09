import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function WaterPlane() {
  const mesh = useRef();
  const { camera } = useThree();

  const uniforms = useRef({
    time: { value: 0 },
    cameraPos: { value: new THREE.Vector3() },
    surfaceY: { value: 0 }, // y=0 is water level
  });

  useFrame(({ clock }) => {
    uniforms.current.time.value = clock.getElapsedTime();
    uniforms.current.cameraPos.value.copy(camera.position);
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[200, 200, 256, 256]} />
      <shaderMaterial
        transparent
        uniforms={uniforms.current}
        vertexShader={`
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 cameraPos;
          uniform float surfaceY;
          varying vec3 vWorldPos;
          varying vec3 vNormal;

          float fresnel() {
            float f = dot(normalize(vNormal), normalize(cameraPos - vWorldPos));
            return pow(1.0 - clamp(f, 0.0, 1.0), 3.0);
          }

          void main() {
            float isBelow = step(vWorldPos.y, surfaceY);

            vec3 aboveColor = vec3(0.2, 0.4, 0.8);
            vec3 belowColor = vec3(0.0, 0.1, 0.3);

            vec3 color = mix(aboveColor, belowColor, isBelow);
            color += fresnel() * vec3(0.8, 0.9, 1.0);

            gl_FragColor = vec4(color, 0.8);
          }
        `}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <WaterPlane />
    </Canvas>
  );
}
