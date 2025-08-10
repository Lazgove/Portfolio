import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo } from 'react';
import WaterPlane from './WaterPlane';

function ScrollCamera({ topY = 10, bottomY = -95 }) {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useFrame(() => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    camera.position.y = THREE.MathUtils.lerp(topY, bottomY, scrollProgress);
    camera.lookAt(0, camera.position.y - 5, 0);
  });
  return null;
}

function WaterScene() {
  const { gl, scene, camera } = useThree();

  // Create render targets for reflection and refraction
  const [reflectionRT] = useState(() => new THREE.WebGLRenderTarget(1024, 1024));
  const [refractionRT] = useState(() => new THREE.WebGLRenderTarget(1024, 1024));

  // Mirror/refraction cameras
  const reflectionCamera = useMemo(() => camera.clone(), [camera]);
  const refractionCamera = useMemo(() => camera.clone(), [camera]);

  // Normal map - you can load a water normals texture or generate procedurally
  // For simplicity let's load a water normal texture
  const normalMap = useMemo(() => new THREE.TextureLoader().load('/textures/waternormals.jpg'), []);

  useFrame(() => {
    // Update reflection camera (mirrored on water plane Y=0)
    reflectionCamera.position.copy(camera.position);
    reflectionCamera.position.y *= -1; // mirror Y
    reflectionCamera.lookAt(new THREE.Vector3(0, 0, 0)); // adjust target as needed
    reflectionCamera.updateMatrixWorld();
    reflectionCamera.updateProjectionMatrix();

    // Render reflection texture
    gl.setRenderTarget(reflectionRT);
    gl.render(scene, reflectionCamera);

    // Render refraction texture
    // Slightly offset clipping plane for refraction could be added here
    gl.setRenderTarget(refractionRT);
    gl.render(scene, camera);

    // Reset render target to default
    gl.setRenderTarget(null);
  });

  return (
    <>
      <WaterPlane
        position={[0, 0, 0]}
        size={500}
        reflectionTexture={reflectionRT.texture}
        refractionTexture={refractionRT.texture}
        normalMap={normalMap}
      />
      {/* Add your seafloor or other scene objects here */}
      <mesh position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#8B7D5B" />
      </mesh>
    </>
  );
}

export default function OceanScene() {
  return (
    <Canvas camera={{ position: [0, 10, 30], fov: 30, near: 0.1, far: 1000 }} shadows style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 50, 50]} intensity={1.5} />

      <ScrollCamera topY={10} bottomY={-95} />

      <WaterScene />
    </Canvas>
  );
}
