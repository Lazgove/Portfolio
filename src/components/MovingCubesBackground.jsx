import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const MovingCubesBackground = () => {
  const mountRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const cubes = [];
    const NUM_CUBES = 50;

    for (let i = 0; i < NUM_CUBES; i++) {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        roughness: 0.5,
        metalness: 0.2,
        transparent: true,
        opacity: 0.6,
      });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      cube.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      scene.add(cube);
      cubes.push(cube);
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();

    const animate = () => {
      requestAnimationFrame(animate);

      // Project mouse to 3D world space
      raycaster.setFromCamera(mouseRef.current, camera);
      const mousePoint = raycaster.ray.origin.clone().add(
        raycaster.ray.direction.clone().multiplyScalar(10) // 10 units into the scene
      );

      cubes.forEach((cube) => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;

        // Apply velocity
        cube.position.add(cube.userData.velocity);

        // Keep inside bounds
        ["x", "y", "z"].forEach((axis) => {
          if (cube.position[axis] > 10 || cube.position[axis] < -10) {
            cube.userData.velocity[axis] *= -1;
          }
        });

        // Mouse attraction
        const distance = cube.position.distanceTo(mousePoint);
        const attractionRadius = 5.0;
        if (distance < attractionRadius) {
          const force = mousePoint.clone().sub(cube.position).normalize();
          const strength = 0.0015 * (attractionRadius - distance); // Stronger when closer
          cube.userData.velocity.add(force.multiplyScalar(strength));
        }

        // Dampen movement
        cube.userData.velocity.multiplyScalar(0.98);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e) => {
      // Normalize mouse to [-1, 1]
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
};

export default MovingCubesBackground;
