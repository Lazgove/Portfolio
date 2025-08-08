// OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const OceanScene = () => {
  const mountRef = useRef(null);
  const submarineRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#021e36", 0.05);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0x2266aa, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x4488cc, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // WATER GRADIENT BACKGROUND (fake)
    const waterColorTop = new THREE.Color("#267aa8");
    const waterColorBottom = new THREE.Color("#021e36");
    const backgroundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 300),
      new THREE.MeshBasicMaterial({
        color: waterColorBottom,
        depthWrite: false,
      })
    );
    backgroundPlane.position.z = -50;
    scene.add(backgroundPlane);

    // SUBMARINE (placeholder cube)
    const geometry = new THREE.BoxGeometry(1, 1, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(geometry, material);
    submarineRef.current = submarine;
    scene.add(submarine);

    // SCROLL LISTENER
    let scrollY = window.scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // ANIMATION LOOP
    function animate() {
      requestAnimationFrame(animate);

      const scrollDepth = scrollY * 0.01; // adjust scroll speed
      if (submarineRef.current) {
        submarineRef.current.position.y = -scrollDepth;
        submarineRef.current.rotation.z = Math.sin(scrollDepth * 0.5) * 0.05;
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default OceanScene;
