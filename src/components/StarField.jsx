import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const StarField = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting for glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Star parameters
    const NUM_STARS = 300;
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    // Base pastel colors
    const baseColors = [
      new THREE.Color(0xffc1cc), // pastel pink
      new THREE.Color(0xa0d8ef), // pastel blue
      new THREE.Color(0xb9fbc0), // pastel green
      new THREE.Color(0xfff1a8), // pastel yellow
      new THREE.Color(0xd0bbff), // pastel purple
    ];

    // Yellow tint color
    const yellowTint = new THREE.Color(0xfff7cc);

    // Helper to mix colors toward yellow tint (factor from 0 to 1)
    function applyYellowTint(color, factor = 0.2) {
      return color.clone().lerp(yellowTint, factor);
    }

    const starsData = [];

    for (let i = 0; i < NUM_STARS; i++) {
      // Apply yellow tint to each base color
      const baseColor = baseColors[i % baseColors.length];
      const tintedColor = applyYellowTint(baseColor, 0.3); // 30% yellow tint

      const material = new THREE.MeshStandardMaterial({
        color: tintedColor,
        emissive: tintedColor,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.5,
      });

      const star = new THREE.Mesh(geometry, material);

      star.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      );

      const baseScale = 0.1 + Math.random() * 0.15;
      star.scale.setScalar(baseScale);

      starsGroup.add(star);

      starsData.push({
        mesh: star,
        originalPos: star.position.clone(),
        baseScale,
      });
    }

    const mouse = new THREE.Vector2(0, 0);

    function onMouseMove(event) {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    const raycaster = new THREE.Raycaster();

    function animate() {
      requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const mousePos3D = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, mousePos3D);

      const repulsionRadius = 5;

      starsData.forEach(({ mesh, originalPos, baseScale }) => {
        const distance = mesh.position.distanceTo(mousePos3D);

        if (distance < repulsionRadius) {
          const strength = 0.1 * (1 - distance / repulsionRadius);
          const dir = mesh.position.clone().sub(mousePos3D).normalize();
          mesh.position.add(dir.multiplyScalar(strength));
        } else {
          mesh.position.lerp(originalPos, 0.02);
        }

        let scaleFactor = 1;
        if (distance < repulsionRadius) {
          scaleFactor = 1 + 0.5 * (1 - distance / repulsionRadius);
        }
        mesh.scale.setScalar(baseScale * scaleFactor);
      });

      starsGroup.rotation.y += 0.0005;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default StarField;
