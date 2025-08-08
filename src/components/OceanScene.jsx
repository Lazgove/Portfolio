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
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0x88bbff, 1.0);
    scene.add(ambientLight);

    // 🎨 Gradient Background Plane
    const gradientHeight = 300;
    const gradientWidth = 200;

    const gradientGeometry = new THREE.PlaneGeometry(gradientWidth, gradientHeight);
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") }, // Light blue
        bottomColor: { value: new THREE.Color("#000000") }, // Black
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
          vec3 color = mix(topColor, bottomColor, 1.0 - vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    gradientPlane.position.set(0, -gradientHeight / 2 + 50, -50); // push it far back
    scene.add(gradientPlane);

    // 🚤 Submarine (Cube)
    const subGeo = new THREE.BoxGeometry(1, 1, 3);
    const subMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(subGeo, subMat);
    submarineRef.current = submarine;
    scene.add(submarine);

    // 🌑 Seafloor
    const floorGeo = new THREE.PlaneGeometry(200, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1f1f1f" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -gradientHeight + 10;
    scene.add(seafloor);

    // Scroll Handling
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY * 0.015;

      // Move submarine + camera together
      if (submarineRef.current && cameraRef.current) {
        submarineRef.current.position.y = targetY;
        cameraRef.current.position.y = targetY;
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
