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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x88bbff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 10, 10);
    scene.add(dirLight);

    // 🌊 Gradient Background
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

    // 🛥 Sphere submarine
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereRef.current = sphere;
    scene.add(sphere);

    // 🌑 Seafloor
    const floorGeo = new THREE.PlaneGeometry(width * 2, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#223366" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -scrollHeight / 2 - 100;
    scene.add(seafloor);

    // 🫧 Background bubbles
    const createBackgroundBubble = () => {
      const geo = new THREE.SphereGeometry(0.05, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      });
      const bubble = new THREE.Mesh(geo, mat);
      bubble.position.set(
        (Math.random() - 0.5) * 5,
        -scrollHeight / 2 + 10,
        (Math.random() - 0.5) * 5
      );
      bubble.userData.velocity = new THREE.Vector3(0, 0.01 + Math.random() * 0.02, 0);
      scene.add(bubble);
      bubbles.push(bubble);
    };
    for (let i = 0; i < 50; i++) createBackgroundBubble();

    // 🐟 Fish loader
    const loader = new GLTFLoader();
    loader.load("/models/low_poly_fish.glb", (gltf) => {
      const fishModel = gltf.scene;
      fishModel.scale.set(0.5, 0.5, 0.5);

      for (let i = 0; i < 20; i++) {
        const fishClone = fishModel.clone();
        fishClone.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10
        );
        fishClone.userData.velocity = new THREE.Vector3(
          Math.random() * 0.02 - 0.01,
          Math.random() * 0.02 - 0.01,
          Math.random() * 0.02 - 0.01
        );
        fishGroup.add(fishClone);
      }

      scene.add(fishGroup);
    });

    // 🎯 Mouse bubbles
    const raycaster = new THREE.Raycaster();
    const spawnMouseBubbles = (pos) => {
      for (let i = 0; i < 5; i++) {
        const geo = new THREE.SphereGeometry(0.05, 8, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
        });
        const bubble = new THREE.Mesh(geo, mat);
        bubble.position.copy(pos).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ));
        bubble.userData.velocity = new THREE.Vector3(0, 0.02 + Math.random() * 0.02, 0);
        scene.add(bubble);
        bubbles.push(bubble);
      }
    };

    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const pos = new THREE.Vector3();
      raycaster.ray.at(5, pos); // spawn slightly in front of camera
      spawnMouseBubbles(pos);
    });

    // Scroll tracking
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // 🌀 Animate loop
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY * 0.01;
      if (sphereRef.current && cameraRef.current) {
        sphereRef.current.position.set(0, targetY, 0);
        cameraRef.current.position.set(0, targetY + 5, 15);
        cameraRef.current.lookAt(0, targetY, 0);
      }

      // Move all bubbles
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.position.add(b.userData.velocity);
        if (b.position.y > 20) {
          scene.remove(b);
          bubbles.splice(i, 1);
        }
      }

      // Fish simple boids + mouse avoidance
      const mouseWorldPos = new THREE.Vector3();
      raycaster.setFromCamera(mouse, cameraRef.current);
      raycaster.ray.at(5, mouseWorldPos);

      fishGroup.children.forEach((fish) => {
        const toMouse = mouseWorldPos.clone().sub(fish.position);
        if (toMouse.length() < 2) {
          fish.userData.velocity.add(toMouse.clone().normalize().multiplyScalar(-0.01));
        }

        fish.position.add(fish.userData.velocity);
        fish.userData.velocity.add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.001,
          (Math.random() - 0.5) * 0.001,
          (Math.random() - 0.5) * 0.001
        ));
        fish.userData.velocity.clampLength(0, 0.05);

        if (fish.position.x > 15) fish.position.x = -15;
        if (fish.position.x < -15) fish.position.x = 15;
        if (fish.position.y > 15) fish.position.y = -15;
        if (fish.position.y < -15) fish.position.y = 15;
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
