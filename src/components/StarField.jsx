import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const StarField = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const NUM_STARS = 300;

    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    // Pastel base colors and yellow tint
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

    // Create a glowing circle texture for sprites
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext("2d");
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 200, 1)");     // stronger inner glow (opacity 1)
    gradient.addColorStop(0.2, "rgba(255, 255, 200, 0.6)"); // stronger middle glow
    gradient.addColorStop(1, "rgba(255, 255, 200, 0)");     // fade out to transparent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    // Store star data
    const starsData = [];

    for (let i = 0; i < NUM_STARS; i++) {
      const baseColor = baseColors[i % baseColors.length];
      const tintedColor = applyYellowTint(baseColor);

      // Sphere mesh
      const geometry = new THREE.SphereGeometry(0.1, 12, 12);
      const material = new THREE.MeshStandardMaterial({
        color: tintedColor,
        emissive: tintedColor,
        emissiveIntensity: 3,  // Increased emissive intensity for more glow
        roughness: 0.3,
        metalness: 0.5,
      });
      const starMesh = new THREE.Mesh(geometry, material);

      starMesh.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      );

      // Random scale between 0.15 and 0.3 for moderate star sizes
      const baseScale = 0.15 + Math.random() * 0.15;
      starMesh.scale.setScalar(baseScale);

      starsGroup.add(starMesh);

      // Add a glowing sprite (billboard) for soft glow effect
      const spriteMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: tintedColor,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,  // increased glow opacity
        depthWrite: false,
      });
      const glowSprite = new THREE.Sprite(spriteMaterial);
      glowSprite.scale.set(baseScale * 3.5, baseScale * 3.5, 1); // larger glow size
      glowSprite.position.copy(starMesh.position);
      starsGroup.add(glowSprite);

      starsData.push({
        mesh: starMesh,
        glow: glowSprite,
        originalPos: starMesh.position.clone(),
        baseScale,
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

      starsData.forEach(({ mesh, glow, originalPos, baseScale }) => {
        const distance = mesh.position.distanceTo(mousePos3D);

        if (distance < repulsionRadius) {
          const strength = 0.1 * (1 - distance / repulsionRadius);
          const dir = mesh.position.clone().sub(mousePos3D).normalize();
          mesh.position.add(dir.multiplyScalar(strength));
          glow.position.copy(mesh.position);
        } else {
          mesh.position.lerp(originalPos, 0.02);
          glow.position.lerp(originalPos, 0.02);
        }

        let scaleFactor = 1;
        if (distance < repulsionRadius) {
          scaleFactor = 1 + 0.5 * (1 - distance / repulsionRadius);
        }
        mesh.scale.setScalar(baseScale * scaleFactor);
        glow.scale.set(baseScale * 3.5 * scaleFactor, baseScale * 3.5 * scaleFactor, 1);
      });

      starsGroup.rotation.y += 0.0005;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default StarField;
