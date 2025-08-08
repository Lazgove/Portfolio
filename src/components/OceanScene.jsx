// components/OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const OceanScene = () => {
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraRef = useRef(null);
  const bubbles = [];
  const fishGroup = new THREE.Group();
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x88bbff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // Gradient Background
    const gradientGeometry = new THREE.PlaneGeometry(width, scrollHeight);
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#64c0ff") },
        bottomColor: { value: new THREE.Color("#000010") },
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
          vec3 color = mix(bottomColor, topColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    gradientPlane.position.set(0, -scrollHeight / 2 + height / 2, -50);
    scene.add(gradientPlane);

    // Sphere (submarine placeholder)
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereRef.current = sphere;
    scene.add(sphere);

    // Seafloor
    const floorGeo = new THREE.PlaneGeometry(width * 2, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#223366" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -scrollHeight / 2 - 100;
    scene.add(seafloor);

    // Static bubbles
    const createBubble = (x, y, z) => {
      const geo = new THREE.SphereGeometry(0.05, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      });
      const bubble = new THREE.Mesh(geo, mat);
      bubble.position.set(x, y, z);
      bubble.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.002,
        0.01 + Math.random() * 0.01,
        (Math.random() - 0.5) * 0.002
      );
      scene.add(bubble);
      bubbles.push(bubble);
    };

    for (let i = 0; i < 50; i++) {
      createBubble(
        (Math.random() - 0.5) * 5,
        -scrollHeight / 2 + 10,
        (Math.random() - 0.5) * 5
      );
    }

    // Mouse move => create bubbles at mouse position
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mousePos3D = new THREE.Vector3();

    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, mousePos3D);

      // spawn multiple small bubbles each move
      for (let i = 0; i < 2; i++) {
        createBubble(
          mousePos3D.x + (Math.random() - 0.5) * 0.2,
          mousePos3D.y + (Math.random() - 0.5) * 0.2,
          mousePos3D.z
        );
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Fish
    const loader = new GLTFLoader();
    loader.load("/models/low_poly_fish.glb", (gltf) => {
      const fishModel = gltf.scene;
      fishModel.scale.set(0.5, 0.5, 0.5);

      for (let i = 0; i < 20; i++) {
        const fishClone = fishModel.clone();
        fishClone.position.set(
          Math.random() * 10 - 5,
          Math.random() * scrollHeight * -0.01,
          Math.random() * 5 - 2.5
        );
        fishClone.rotation.y = Math.random() > 0.5 ? Math.PI : 0;
        fishGroup.add(fishClone);
      }

      scene.add(fishGroup);
    });

    // Scroll handling
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

      // Bubble motion
      bubbles.forEach((b) => {
        b.position.add(b.userData.velocity);
        if (b.position.y > 10) {
          b.position.y = -scrollHeight / 2 + 10;
        }
      });

      // Fish swimming
      fishGroup.children.forEach((fish) => {
        fish.position.x += 0.01;
        if (fish.position.x > 6) fish.position.x = -6;
      });

      renderer.render(scene, cameraRef.current);
    };
    animate();

    // Resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
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
