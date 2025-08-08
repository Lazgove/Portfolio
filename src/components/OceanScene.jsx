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

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#000000", 20, 100);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 200);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0x66aaff, 0.8);
    scene.add(ambientLight);

    // 🔷 GRADIENT BACKGROUND PLANE
    const bgGeometry = new THREE.PlaneGeometry(100, 300);
    const bgMaterial = new THREE.ShaderMaterial({
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
      side: THREE.BackSide,
      depthWrite: false,
    });
    const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    bgPlane.position.z = -50;
    scene.add(bgPlane);

    // 🔶 SUBMARINE (placeholder cube)
    const subGeo = new THREE.BoxGeometry(1, 1, 3);
    const subMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(subGeo, subMat);
    submarineRef.current = submarine;
    scene.add(submarine);

    // 🟫 SEAFLOOR
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1f1f1f" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -80;
    scene.add(seafloor);

    // SCROLL TRACKING
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // ANIMATE
    const animate = () => {
      requestAnimationFrame(animate);

      const scrollDepth = scrollY * 0.05;
      if (submarineRef.current) {
        submarineRef.current.position.y = -scrollDepth;
        submarineRef.current.rotation.z = Math.sin(scrollDepth * 0.5) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // CLEANUP
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default OceanScene;
