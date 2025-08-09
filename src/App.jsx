import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Water } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, ShaderPass } from '@react-three/postprocessing';

function Camera() {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      // Simple vertical oscillation for demo
      ref.current.position.y = Math.sin(Date.now() * 0.001) * 2;
    }
  });
  return <perspectiveCamera ref={ref} position={[0, 5, 10]} />;
}

function WaterSurface() {
  const waterNormals = new THREE.TextureLoader().load('/waternormals.jpg'); // you need this texture
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  return (
    <Water
      args={[new THREE.PlaneGeometry(100, 100)]}
      rotation-x={-Math.PI / 2}
      waterNormals={waterNormals}
      sunDirection={[1, 1, 1]}
      sunColor="white"
      waterColor="#001e0f"
      distortionScale={3.7}
      fog={true}
    />
  );
}

function UnderwaterEffects({ enabled }) {
  const { scene, camera } = useThree();

  return enabled ? (
    <EffectComposer>
      <ShaderPass
        attachArray="passes"
        args={[
          {
            uniforms: {
              tDiffuse: { value: null },
              color: { value: new THREE.Color(0x0077cc) },
              opacity: { value: 0.3 },
            },
            vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D tDiffuse;
              uniform vec3 color;
              uniform float opacity;
              varying vec2 vUv;
              void main() {
                vec4 original = texture2D(tDiffuse, vUv);
                gl_FragColor = mix(original, vec4(color, 1.0), opacity);
              }
            `,
          },
        ]}
      />
    </EffectComposer>
  ) : null;
}

function Scene() {
  const cameraRef = useRef();
  const [underwater, setUnderwater] = useState(false);

  useFrame(() => {
    if (cameraRef.current) {
      const y = cameraRef.current.position.y;
      setUnderwater(y < 0); // water surface at y=0
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <WaterSurface />
      <Camera ref={cameraRef} />
      <UnderwaterEffects enabled={underwater} />
      {/* Add 3D objects or fish here */}
    </>
  );
}

export default function App() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
      <Scene />
    </Canvas>
  );
}
