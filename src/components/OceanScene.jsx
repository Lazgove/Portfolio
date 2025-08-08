// OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const OceanScene = () => {
  const mountRef = useRef(null);
  const submarineRef = useRef(null);
  let scrollY = 0;

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#000000", 30, 150);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 200);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x88bbff, 1.0);
    scene.add(ambientLight);

    // 🌊 Gradient Background
    const bgGeometry = new THREE.PlaneGeometry(40, 200);
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") },    // Light blue
        bottomColor: { value: new THREE.Color("#000000") }, // Deep black
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(topColor, bottomColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    bgPlane.position.z = -20;
    bgPlane.position.y = -50; // Lower to cover full scroll range
    scene.add(bgPlane);

    // 🚤 Submarine placeholder
    const subGeo = new THREE.BoxGeometry(1, 1, 3);
    const subMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(subGeo, subMat);
    submarineRef.current = submarine;
    scene.add(submarine);

    // 🌑 Seafloor
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1f1f1f" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -100;
    scene.add(seafloor);

    // 🖱️ Scroll tracking
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // 🌀 Animation
    const animate = () => {
      requestAnimationFrame(animate);

      const scrollDepth = scrollY * 0.01; // MUCH slower descent
      if (submarineRef.current) {
        submarineRef.current.position.y = -scrollDepth;
        submarineRef.current.rotation.z = Math.sin(scrollDepth * 0.5) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default OceanScene;
