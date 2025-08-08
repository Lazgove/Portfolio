// OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const OceanScene = () => {
  const mountRef = useRef(null);
  const submarineRef = useRef(null);
  const cameraRef = useRef(null);

  let scrollY = 0;

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 500);
    camera.position.z = 10;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x88bbff, 1.0);
    scene.add(ambientLight);

    // 🎨 Gradient Background
    const gradientHeight = 300;
    const gradientGeometry = new THREE.PlaneGeometry(100, gradientHeight);
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") },
        bottomColor: { value: new THREE.Color("#000000") },
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
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    gradientPlane.position.z = -50;
    gradientPlane.position.y = -gradientHeight / 2 + 30;
    scene.add(gradientPlane);

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
    seafloor.position.y = -gradientHeight + 10;
    scene.add(seafloor);

    // Scroll Tracking
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY * 0.015;

      // Move submarine
      if (submarineRef.current) {
        submarineRef.current.position.y = targetY;
      }

      // Smooth camera follow
      if (cameraRef.current) {
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
      }

      renderer.render(scene, cameraRef.current);
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
