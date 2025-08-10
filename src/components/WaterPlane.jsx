import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { waterVertexShader } from '../shaders/waterVertexShader.js';
import { waterFragmentShader } from '../shaders/waterFragmentShader.js';

export default function WaterPlane() {
  const ref = useRef();
  const { scene, gl, camera, size } = useThree();

  // Render targets for reflection and refraction
  const reflectionRenderTarget = useRef();
  const refractionRenderTarget = useRef();

  // Cameras for reflection/refraction
  const reflectionCamera = useRef();
  const refractionCamera = useRef();

  // Uniforms for the shader
  const uniforms = useRef({
    time: { value: 0 },
    reflectionTexture: { value: null },
    refractionTexture: { value: null },
    normalMap: { value: null }, // we'll load a normal map
    cameraPosition: { value: new THREE.Vector3() }
  });

  useEffect(() => {
    reflectionRenderTarget.current = new THREE.WebGLRenderTarget(size.width, size.height);
    refractionRenderTarget.current = new THREE.WebGLRenderTarget(size.width, size.height);

    reflectionCamera.current = new THREE.PerspectiveCamera(
      camera.fov,
      size.width / size.height,
      camera.near,
      camera.far
    );
    refractionCamera.current = new THREE.PerspectiveCamera(
      camera.fov,
      size.width / size.height,
      camera.near,
      camera.far
    );

    // Load normal map texture for distortion
    new THREE.TextureLoader().load(
      '/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        uniforms.current.normalMap.value = texture;
      }
    );
  }, [camera, size]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    uniforms.current.time.value += delta;
    uniforms.current.cameraPosition.value.copy(camera.position);

    // Update reflection camera to be mirrored on water plane (y=0)
    reflectionCamera.current.position.copy(camera.position);
    reflectionCamera.current.position.y *= -1; // Mirror Y
    reflectionCamera.current.up.set(0, -1, 0);
    reflectionCamera.current.lookAt(0, 0, 0);
    reflectionCamera.current.updateMatrixWorld();
    reflectionCamera.current.updateProjectionMatrix();

    // Render reflection
    gl.setRenderTarget(reflectionRenderTarget.current);
    gl.clear();
    gl.render(scene, reflectionCamera.current);

    // Setup refraction camera same as main camera for now
    refractionCamera.current.position.copy(camera.position);
    refractionCamera.current.quaternion.copy(camera.quaternion);
    refractionCamera.current.updateMatrixWorld();
    refractionCamera.current.updateProjectionMatrix();

    // Render refraction
    gl.setRenderTarget(refractionRenderTarget.current);
    gl.clear();
    gl.render(scene, refractionCamera.current);

    gl.setRenderTarget(null); // back to default framebuffer

    // Update shader uniforms with rendered textures
    const material = ref.current.material;
    material.uniforms.reflectionTexture.value = reflectionRenderTarget.current.texture;
    material.uniforms.refractionTexture.value = refractionRenderTarget.current.texture;
    material.uniforms.time.value = uniforms.current.time.value;
    material.uniforms.cameraPosition.value.copy(camera.position);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[500, 500, 256, 256]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms.current}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
