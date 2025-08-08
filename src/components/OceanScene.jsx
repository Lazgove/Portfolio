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

    // Light
    const ambientLight = new THREE.AmbientLight(0x88bbff, 1.0);
    scene.add(ambientLight);

    // 🎨 Gradient Background Plane - covers full width and scroll height
    const scrollHeight = document.body.scrollHeight;

    const gradientGeometry = new THREE.PlaneGeometry(width, scrollHeight);
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") }, // Light blue
        bottomColor: { value: new THREE.Color("#000010") }, // Almost black
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
          // gradient from topColor at top (vUv.y=1) to bottomColor at bottom (vUv.y=0)
          vec3 color = mix(bottomColor, topColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    // position so top aligns with y=0, and bottom is at -scrollHeight
    gradientPlane.position.set(0, -scrollHeight / 2 + height / 2, -50);
    scene.add(gradientPlane);

    // 🚤 Submarine (Cube)
    const subGeo = new THREE.BoxGeometry(1, 1, 3);
    const subMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(subGeo, subMat);
    submarineRef.current = submarine;
    scene.add(submarine);

    // 🌑 Seafloor (bottom plane)
    const floorGeo = new THREE.PlaneGeometry(width, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1f1f1f" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -scrollHeight + 50;
    scene.add(seafloor);

    // Scroll Handling
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Resize Handling
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Update gradient plane and floor size & position
      gradientPlane.geometry.dispose();
      gradientPlane.geometry = new THREE.PlaneGeometry(w, document.body.scrollHeight);
      gradientPlane.position.set(0, -document.body.scrollHeight / 2 + h / 2, -50);

      floorGeo.dispose();
      seafloor.geometry.dispose();
      seafloor.geometry = new THREE.PlaneGeometry(w, 200);
      seafloor.position.y = -document.body.scrollHeight + 50;
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY;

      if (submarineRef.current && cameraRef.current) {
        submarineRef.current.position.set(0, targetY, 0);
        cameraRef.current.position.set(0, targetY, 15);
      }

      renderer.render(scene, cameraRef.current);
    };
    animate();

    // Cleanup
    return () => {
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
        pointerEvents: "none",
      }}
    />
  );
};

export default OceanScene;
