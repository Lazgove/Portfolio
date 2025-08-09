import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Water() {
  const mesh = useRef();
  const { camera, scene } = useThree();

  // Load noise texture for caustics & droplets simulation
  const noiseTexture = useMemo(() => {
    const size = 256;
    const data = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      data[i] = Math.random() * 255;
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.LuminanceFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const uniforms = useRef({
    time: { value: 0 },
    cameraPos: { value: new THREE.Vector3() },
    lightDir: { value: new THREE.Vector3(0.577, 0.577, 0.577).normalize() },
    waterColor: { value: new THREE.Color(0.0, 0.4, 0.7) },
    noiseTex: { value: noiseTexture },
    terrainHeightMap: { value: null }, // can add if available
  });

  useFrame(({ clock }) => {
    uniforms.current.time.value = clock.getElapsedTime();
    uniforms.current.cameraPos.value.copy(camera.position);
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry args={[200, 200, 256, 256]} />
      <shaderMaterial
        transparent
        uniforms={uniforms.current}
        vertexShader={`
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          uniform vec3 cameraPos;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vViewDir = normalize(cameraPos - vWorldPos);

            gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;

          uniform float time;
          uniform vec3 cameraPos;
          uniform vec3 lightDir;
          uniform vec3 waterColor;
          uniform sampler2D noiseTex;

          varying vec3 vWorldPos;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          // Constants
          const float PI = 3.14159265359;
          const float eta = 1.33; // Water refraction index

          // Fresnel reflectance (Schlick approx)
          float fresnel(vec3 I, vec3 N) {
            float cosTheta = clamp(dot(-I, N), 0.0, 1.0);
            float f0 = 0.02;
            return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
          }

          // Simple chromatic aberration by wavelength offset
          vec3 refractChromatic(vec3 I, vec3 N) {
            float etaR = eta * 0.995;
            float etaG = eta;
            float etaB = eta * 1.005;

            float kr = fresnel(I, N);
            vec3 refractR = refract(I, N, 1.0 / etaR);
            vec3 refractG = refract(I, N, 1.0 / etaG);
            vec3 refractB = refract(I, N, 1.0 / etaB);

            return vec3(
              kr * refractR.x + (1.0 - kr) * refractR.x,
              kr * refractG.y + (1.0 - kr) * refractG.y,
              kr * refractB.z + (1.0 - kr) * refractB.z
            );
          }

          // Simple noise-based caustics approximation
          float caustics(vec2 uv) {
            float n = texture2D(noiseTex, uv * 10.0 + time * 0.2).r;
            return smoothstep(0.5, 0.7, n);
          }

          // Underwater light scattering/extinction
          vec3 waterExtinction(vec3 color, float depth) {
            float scatter = exp(-depth * 0.1);
            return color * scatter;
          }

          // Simple coastline detection by height (simulate terrain)
          float coastline(float height) {
            return smoothstep(0.1, 0.15, height);
          }

          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(vViewDir);
            vec3 L = normalize(lightDir);

            // Fresnel term for reflection strength
            float F = fresnel(V, N);

            // Reflection color (sky-blue)
            vec3 reflectionColor = vec3(0.5, 0.7, 0.9);

            // Refraction color: water color modulated by caustics & light
            vec3 refractionCol = waterColor;

            // Simulate caustics intensity
            float c = caustics(vWorldPos.xz * 0.1);

            refractionCol += vec3(c * 0.3);

            // Simulate water depth from Y coord (0 = surface, negative = underwater)
            float depth = max(-vWorldPos.y, 0.0);

            // Extinction by depth
            refractionCol = waterExtinction(refractionCol, depth);

            // Coastline factor (dummy terrain height map sim)
            float coast = coastline(vWorldPos.y + 1.0); // +1 to shift water level

            // Mix reflection and refraction by Fresnel
            vec3 color = mix(refractionCol, reflectionColor, F);

            // Modulate color near coastline
            color = mix(color, vec3(0.8, 0.7, 0.6), coast);

            // Simple alpha fade underwater surface
            float alpha = smoothstep(0.0, -0.5, vWorldPos.y);

            gl_FragColor = vec4(color, alpha);
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
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Water />
    </Canvas>
  );
}
