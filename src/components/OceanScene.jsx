// components/OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// Add at the top with your imports
import { Raycaster, Vector2, Vector3 } from "three";

const OceanScene = () => {
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraRef = useRef(null);
  const bubbles = [];
  const fishGroup = new THREE.Group();

  // 🆕 Interactive bubble state
  const mouse = new Vector2();
  const raycaster = new Raycaster();
  const interactiveBubbles = [];

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;
    const scene = new THREE.Scene();

    // --- existing camera, renderer, lights, gradient plane, sphere, seafloor, fish loader here ---

    // Regular ambient bubbles
    const createBubble = (x, y, z, size = 0.05) => {
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      });
      const bubble = new THREE.Mesh(geo, mat);
      bubble.position.set(x, y, z);
      scene.add(bubble);
      return bubble;
    };

    for (let i = 0; i < 50; i++) {
      bubbles.push(
        createBubble(
          (Math.random() - 0.5) * 5,
          -scrollHeight / 2 + 10,
          (Math.random() - 0.5) * 5
        )
      );
    }

    // 🆕 Mouse-based bubble spawning
    const planeForBubbles = new THREE.Plane(new Vector3(0, 0, 1), 0); // XY plane at Z=0

    const handleMouseMove = (event) => {
      // Convert mouse to NDC (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Raycast from camera to plane
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersectionPoint = new Vector3();
      raycaster.ray.intersectPlane(planeForBubbles, intersectionPoint);

      // Spawn new bubble at that location
      const b = createBubble(
        intersectionPoint.x,
        intersectionPoint.y,
        intersectionPoint.z,
        0.07
      );
      b.userData = { life: 1 }; // Track bubble lifetime
      interactiveBubbles.push(b);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Scroll listener (unchanged)
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY * 0.01;
      if (sphereRef.current && cameraRef.current) {
        sphereRef.current.position.set(0, targetY, 0);
        cameraRef.current.position.set(0, targetY + 5, 15);
        cameraRef.current.lookAt(0, targetY, 0);
      }

      // Ambient bubbles float upward
      bubbles.forEach((b) => {
        b.position.y += 0.02;
        if (b.position.y > 10) b.position.y = -scrollHeight / 2 + 10;
      });

      // 🆕 Animate interactive bubbles
      for (let i = interactiveBubbles.length - 1; i >= 0; i--) {
        const b = interactiveBubbles[i];
        b.position.y += 0.03; // float
        b.userData.life -= 0.01; // fade timer
        b.material.opacity = b.userData.life * 0.4; // fade out
        if (b.userData.life <= 0) {
          scene.remove(b);
          interactiveBubbles.splice(i, 1);
        }
      }

      // Fish movement
      fishGroup.children.forEach((fish) => {
        fish.position.x += 0.01;
        if (fish.position.x > 6) fish.position.x = -6;
      });

      renderer.render(scene, cameraRef.current);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
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
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "auto", // allow mouse tracking
      }}
    />
  );
};

export default OceanScene;
