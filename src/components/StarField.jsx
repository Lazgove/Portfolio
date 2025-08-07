import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const StarField = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Postprocessing setup
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.3,  // strength
      0.9,  // radius
      0.3   // threshold
    );
    composer.addPass(bloomPass);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const NUM_STARS = 300;
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    const baseColors = [
      new THREE.Color(0xffc1cc),
      new THREE.Color(0xa0d8ef),
      new THREE.Color(0xb9fbc0),
      new THREE.Color(0xfff1a8),
      new THREE.Color(0xd0bbff),
    ];
    const yellowTint = new THREE.Color(0xfff7cc);

    function applyYellowTint(color, factor = 0.3) {
      return color.clone().lerp(yellowTint, factor);
    }

    function varyColorBrightness(color) {
      const hsl = {};
      color.getHSL(hsl);
      hsl.l = THREE.MathUtils.clamp(hsl.l * (0.85 + Math.random() * 0.3), 0, 1);
      const newColor = new THREE.Color();
      newColor.setHSL(hsl.h, hsl.s, hsl.l);
      return newColor;
    }

    const starsData = [];

    for (let i = 0; i < NUM_STARS; i++) {
      const baseColor = baseColors[i % baseColors.length];
      let tintedColor = applyYellowTint(baseColor);
      tintedColor = varyColorBrightness(tintedColor);

      const radius = 0.1 + Math.random() * 0.3;
      const emissiveIntensity = 1 + Math.random() * 2;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: tintedColor,
        emissive: tintedColor,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.3,
        metalness: 0.5,
      });
      const starMesh = new THREE.Mesh(geometry, material);

      starMesh.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      );

      starsGroup.add(starMesh);

      starsData.push({
        mesh: starMesh,
        originalPos: starMesh.position.clone(),
        baseRadius: radius,
      });
    }

    const mouse = new THREE.Vector2(0, 0);

    function onMouseMove(event) {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    const raycaster = new THREE.Raycaster();

    function animate() {
      requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const mousePos3D = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, mousePos3D);

      const repulsionRadius = 5;

      starsData.forEach(({ mesh, originalPos, baseRadius }) => {
        const distance = mesh.position.distanceTo(mousePos3D);

        if (distance < repulsionRadius) {
          const strength = 0.1 * (1 - distance / repulsionRadius);
          const dir = mesh.position.clone().sub(mousePos3D).normalize();
          mesh.position.add(dir.multiplyScalar(strength));
        } else {
          mesh.position.lerp(originalPos, 0.02);
        }

        let scaleFactor = 1;
        if (distance < repulsionRadius) {
          scaleFactor = 1 + 0.5 * (1 - distance / repulsionRadius);
        }

        mesh.scale.setScalar(scaleFactor);
      });

      starsGroup.rotation.y += 0.0005;

      // Use composer to render with bloom
      composer.render();
    }

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current.removeChild(renderer.domElement);
      composer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default StarField;
