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
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Create stars
    const NUM_STARS = 1000;

    // Positions array for BufferGeometry
    const positions = new Float32Array(NUM_STARS * 3);
    const sizes = new Float32Array(NUM_STARS);

    for (let i = 0; i < NUM_STARS; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      sizes[i] = Math.random() * 1.5 + 0.5; // base size
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Star material with size attenuation & alpha for subtle blur effect
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    // Track mouse in normalized device coords
    const mouse = new THREE.Vector2(0, 0);

    function onMouseMove(event) {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    // We'll convert mouse coords to 3D space on z=0 plane for interaction
    const raycaster = new THREE.Raycaster();

    // Temporary vectors for calculations
    const tempVec = new THREE.Vector3();
    const starPos = new THREE.Vector3();

    // Store original star positions for reference
    const originalPositions = [];
    for (let i = 0; i < NUM_STARS; i++) {
      originalPositions.push(
        new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        )
      );
    }

    // Animate loop
    function animate() {
      requestAnimationFrame(animate);

      // Convert mouse to 3D world coordinate on z=0 plane
      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, intersectPoint);

      // Gradient radius for attraction
      const attractionRadius = 4.0;

      // Update star positions with subtle attraction & blur (size) effect
      for (let i = 0; i < NUM_STARS; i++) {
        starPos.fromBufferAttribute(geometry.attributes.position, i);
        const origPos = originalPositions[i];

        const distance = starPos.distanceTo(intersectPoint);

        if (distance < attractionRadius) {
          // Calculate pull force: stronger closer to mouse
          const strength = 0.02 * (1 - distance / attractionRadius);

          // Direction vector from star to mouse point
          const dir = intersectPoint.clone().sub(starPos).normalize();

          // Move star slightly toward mouse
          starPos.add(dir.multiplyScalar(strength));
        } else {
          // Slowly move star back to original position when outside radius
          starPos.lerp(origPos, 0.02);
        }

        // Update positions attribute
        geometry.attributes.position.setXYZ(i, starPos.x, starPos.y, starPos.z);

        // Update size attribute to simulate focus/blur
        // Smaller size far from mouse, bigger near mouse
        const baseSize = sizes[i];
        let sizeFactor = 1.0;
        if (distance < attractionRadius) {
          sizeFactor = 1 + 0.7 * (1 - distance / attractionRadius);
        } else {
          sizeFactor = 1;
        }
        geometry.attributes.size.setX(i, baseSize * sizeFactor);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;

      // Update material size to average size scaled by some factor (optional)
      // material.size = 0.15;

      // Slowly rotate the whole starfield for subtle dynamic
      stars.rotation.y += 0.0002;

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
