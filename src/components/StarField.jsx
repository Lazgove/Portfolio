import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

const StarField = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b1e); // Nebula-like deep background

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Postprocessing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.4,  // strength
      0.5,  // radius
      0.2   // threshold
    );
    composer.addPass(bloomPass);

    const bokehPass = new BokehPass(scene, camera, {
      focus: 15,         // Focus distance
      aperture: 0.00025, // Depth of field intensity
      maxblur: 0.015,    // Max blur radius
    });
    composer.addPass(bokehPass);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Stars
    const NUM_STARS = 600;
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    const baseColors = [
      new THREE.Color(0xffc1cc), // pastel pink
      new THREE.Color(0xa0d8ef), // pastel blue
      new THREE.Color(0xb9fbc0), // mint green
      new THREE.Color(0xfff1a8), // pastel yellow
      new THREE.Color(0xd0bbff), // soft purple
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

      const radius = 0.02 + Math.random() * 0.03;
      const emissiveIntensity = 1 + Math.random() * 2;

      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: tintedColor,
        emissive: tintedColor,
        emissiveIntensity,
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
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mousePos3D = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(planeZ, mousePos3D);

      const repulsionRadius = 5;

      starsData.forEach(({ mesh, originalPos }) => {
        const distance = mesh.position.distanceTo(mousePos3D);

        if (distance < repulsionRadius) {
          const strength = 0.1 * (1 - distance / repulsionRadius);
          const dir = mesh.position.clone().sub(mousePos3D).normalize();
          mesh.position.add(dir.multiplyScalar(strength));
        } else {
          mesh.position.lerp(originalPos, 0.02);
        }

        const scaleFactor = distance < repulsionRadius
          ? 1 + 0.5 * (1 - distance / repulsionRadius)
          : 1;
        mesh.scale.setScalar(scaleFactor);
      });

      starsGroup.rotation.y += 0.0005;

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
