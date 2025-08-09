import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Water() {
  const mesh = useRef();
  const { camera } = useThree();

  const uniforms = useRef({
    time: { value: 0 },
    cameraPos: { value: new THREE.Vector3() },
    waterColor: { value: new THREE.Color(0.0, 0.3, 0.5) },
    lightDir: { value: new THREE.Vector3(1, 1, 1).normalize() }
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
          uniform vec3 waterColor;
          uniform vec3 lightDir;
          varying vec3 vWorldPos;
          varying vec3 vNormal;

          // Fresnel reflectance
          float fresnelReflectance(vec3 viewDir, vec3 normal) {
            float f0 = 0.02; // base reflectance for water
            float fresnel = f0 + (1.0 - f0) * pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
            return fresnel;
          }

          void main() {
            vec3 viewDir = normalize(cameraPos - vWorldPos);

            // Fresnel term
            float fresnel = fresnelReflectance(viewDir, normalize(vNormal));

            // Basic water color blend (placeholder for refraction/caustics logic)
            vec3 reflectionColor = vec3(0.5, 0.7, 0.9);
            vec3 refractionColor = waterColor;

            vec3 finalColor = mix(refractionColor, reflectionColor, fresnel);

            gl_FragColor = vec4(finalColor, 0.9);
          }
        `}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} />
      <Water />
    </Canvas>
  );
}
