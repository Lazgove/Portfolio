import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from '@react-three/drei';

// Register the Water class so react-three-fiber can handle it
extend({ Water });

function WaterPlane() {
  const waterRef = useRef();
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!waterRef.current) return;

    // Load water normals texture
    const waterNormals = new THREE.TextureLoader().load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    );

    // Setup Water object properties
    waterRef.current.material.uniforms['normalSampler'].value = waterNormals;
    waterRef.current.material.uniforms['sunDirection'].value.copy(new THREE.Vector3(1, 1, 1).normalize());
    waterRef.current.material.uniforms['sunColor'].value.set('#ffffff');
    waterRef.current.material.uniforms['waterColor'].value.set('#001e0f');
    waterRef.current.material.uniforms['distortionScale'].value = 3.7;
  }, []);

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms['time'].value += delta;
    }
  });

  return (
    <water
      ref={waterRef}
      args={[
        new THREE.PlaneGeometry(10000, 10000),
        {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: null, // set in useEffect
          alpha: 1.0,
          sunDirection: new THREE.Vector3(),
          sunColor: new THREE.Color(0xffffff),
          waterColor: new THREE.Color(0x001e0f),
          distortionScale: 3.7,
          fog: true,
        },
      ]}
      rotation-x={-Math.PI / 2}
    />
  );
}

export default function WaterScene() {
  return (
    <Canvas camera={{ position: [30, 30, 100], fov: 55, near: 1, far: 20000 }}>
      {/* Ambient and directional light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 100, 100]} intensity={0.8} />

      {/* Skybox */}
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />

      {/* Water plane */}
      <WaterPlane />
    </Canvas>
  );
}
