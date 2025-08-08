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
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x88bbff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // 🎨 Gradient Background Plane filling viewport
    const gradientGeometry = new THREE.PlaneGeometry(width, height);
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") }, // Light blue
        bottomColor: { value: new THREE.Color("#000010") }, // Dark bottom
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
          // Gradient from topColor at top (vUv.y = 1) to bottomColor at bottom (vUv.y = 0)
          vec3 color = mix(bottomColor, topColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    gradientPlane.position.set(0, 0, -50); // Push far back
    scene.add(gradientPlane);

    // ⚪ Submarine (Sphere)
    const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(sphereGeometry, sphereMaterial);
    submarineRef.current = submarine;
    scene.add(submarine);

    // 🌑 Seafloor (Ground Plane)
    const floorGeo = new THREE.PlaneGeometry(width * 2, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#223366" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -height / 2 - 50;
    scene.add(seafloor);

    // Scroll Handling
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Animate loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Move submarine and camera down as user scrolls (slow factor)
      const targetY = -scrollY * 0.01;

      if (submarineRef.current && cameraRef.current) {
        submarineRef.current.position.set(0, targetY, 0);
        cameraRef.current.position.set(0, targetY + 5, 15);
        cameraRef.current.lookAt(0, targetY, 0);
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
      }}
    />
  );
};

export default OceanScene;
