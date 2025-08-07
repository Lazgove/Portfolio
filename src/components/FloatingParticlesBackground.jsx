import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const SphereBackground = () => {
  const mountRef = React.useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 7;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Pastel colors palette
    const pastelColors = [
      "#A8D5BA", // light green
      "#F9D5E5", // light pink
      "#FFE6A7", // light yellow
      "#C9C9FF", // light blue
      "#FFD6BA", // peach
      "#D0F4DE", // mint
      "#F6F5AE", // pale yellow
      "#C5D8A4", // sage
    ];

    const NUM_SPHERES = 100;
    const spheres = [];

    // Create spheres with random pastel color, position, and velocity
    for (let i = 0; i < NUM_SPHERES; i++) {
      const geometry = new THREE.SphereGeometry(0.12, 24, 24); // bigger spheres
      const color = new THREE.Color(pastelColors[i % pastelColors.length]);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.2,
        transparent: true,
        opacity: 0.8,
      });

      const sphere = new THREE.Mesh(geometry, material);

      sphere.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 8
      );

      sphere.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
      };

      scene.add(sphere);
      spheres.push(sphere);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Track mouse in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();

    function onMouseMove(event) {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;
    }

    window.addEventListener("mousemove", onMouseMove);

    // Animate function
    const animate = () => {
      requestAnimationFrame(animate);

      // Convert mouse coords to 3D world coords at z=0 plane
      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, intersectPoint);

      spheres.forEach((sphere) => {
        // Always apply a subtle attraction force (weakened with distance)
        const dir = intersectPoint.clone().sub(sphere.position);
        const dist = dir.length();

        // Make attraction radius bigger and smoother falloff
        const attractionRadius = 3.0;
        if (dist < attractionRadius) {
          const strength = 0.008 * (1 - dist / attractionRadius);
          const force = dir.normalize().multiplyScalar(strength);
          sphere.userData.velocity.add(force);
        }

        // Update position with velocity and apply damping
        sphere.position.add(sphere.userData.velocity);
        sphere.userData.velocity.multiplyScalar(0.92);

        // Keep spheres inside bounding box [-4,4], [-2.5,2.5], [-4,4]
        ["x", "y", "z"].forEach((axis) => {
          const maxBound = axis === "y" ? 2.5 : 4;
          if (sphere.position[axis] > maxBound) {
            sphere.position[axis] = maxBound;
            sphere.userData.velocity[axis] *= -0.6; // softer bounce
          }
          if (sphere.position[axis] < -maxBound) {
            sphere.position[axis] = -maxBound;
            sphere.userData.velocity[axis] *= -0.6;
          }
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default SphereBackground;
