// components/OceanScene.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const OceanScene = () => {
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraRef = useRef(null);
  const bubbles = [];
  const fishData = []; // store fish mesh + velocity
  const fishGroup = new THREE.Group();
  const mouse = new THREE.Vector2(0, 0);

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
    const ambientLight = new THREE.AmbientLight(0x88bbff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // 🎨 Gradient Background Plane
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

    // 🌊 Submarine Placeholder — Sphere
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

    // 🫧 Bubbles
    const createBubble = () => {
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
      scene.add(bubble);
      bubbles.push(bubble);
    };
    for (let i = 0; i < 50; i++) createBubble();

    // 🐟 Load Fish Model
    const loader = new GLTFLoader();
    loader.load("/models/low_poly_fish.glb", (gltf) => {
      const fishModel = gltf.scene;
      fishModel.scale.set(0.5, 0.5, 0.5);

      for (let i = 0; i < 30; i++) {
        const fishClone = fishModel.clone();
        fishClone.position.set(
          Math.random() * 10 - 5,
          Math.random() * -10,
          Math.random() * 5 - 2.5
        );
        fishClone.rotation.y = Math.random() > 0.5 ? Math.PI : 0;

        // Give each fish an initial velocity
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        );

        fishData.push({ mesh: fishClone, velocity });
        fishGroup.add(fishClone);
      }

      scene.add(fishGroup);
    });

    // Mouse move → update vector
    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll tracking
    let scrollY = 0;
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
    });

    // Boids + mouse avoidance update
    const updateFish = () => {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const mousePos3D = new THREE.Vector3();
      raycaster.ray.at(10, mousePos3D); // project mouse into scene

      const perceptionRadius = 2;
      const mouseAvoidRadius = 3;

      fishData.forEach((fish, i) => {
        let alignment = new THREE.Vector3();
        let cohesion = new THREE.Vector3();
        let separation = new THREE.Vector3();
        let total = 0;

        fishData.forEach((other, j) => {
          if (i === j) return;
          const dist = fish.mesh.position.distanceTo(other.mesh.position);
          if (dist < perceptionRadius) {
            alignment.add(other.velocity);
            cohesion.add(other.mesh.position);
            separation.add(
              fish.mesh.position.clone().sub(other.mesh.position).divideScalar(dist)
            );
            total++;
          }
        });

        if (total > 0) {
          alignment.divideScalar(total).setLength(0.02);
          cohesion.divideScalar(total).sub(fish.mesh.position).setLength(0.01);
          separation.divideScalar(total).setLength(0.03);

          fish.velocity.add(alignment).add(cohesion).add(separation);
        }

        // Mouse avoidance
        const distToMouse = fish.mesh.position.distanceTo(mousePos3D);
        if (distToMouse < mouseAvoidRadius) {
          const avoidDir = fish.mesh.position
            .clone()
            .sub(mousePos3D)
            .normalize()
            .multiplyScalar(0.05);
          fish.velocity.add(avoidDir);
        }

        // Limit speed
        fish.velocity.clampLength(0.01, 0.05);

        // Apply velocity
        fish.mesh.position.add(fish.velocity);

        // Face direction of travel
        fish.mesh.lookAt(fish.mesh.position.clone().add(fish.velocity));
      });
    };

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);

      const targetY = -scrollY * 0.01;
      if (sphereRef.current && cameraRef.current) {
        sphereRef.current.position.set(0, targetY, 0);
        cameraRef.current.position.set(0, targetY + 5, 15);
        cameraRef.current.lookAt(0, targetY, 0);
      }

      // Bubble float
      bubbles.forEach((b) => {
        b.position.y += 0.02;
        if (b.position.y > 10) b.position.y = -scrollHeight / 2 + 10;
      });

      // Update fish boids
      updateFish();

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
