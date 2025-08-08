import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { VergilWaterShader } from "./VergilWaterShader"; // your local file

const OceanScene = () => {
  const mountRef = useRef(null);
  const submarineRef = useRef(null);
  let scrollY = 0;

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#021e36", 10, 100);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 200);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x6688aa, 1.5);
    scene.add(ambientLight);

    // Submarine (cube)
    const geometry = new THREE.BoxGeometry(1, 1, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const submarine = new THREE.Mesh(geometry, material);
    submarineRef.current = submarine;
    scene.add(submarine);

    // Seafloor
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#2e2b1a" });
    const seafloor = new THREE.Mesh(floorGeo, floorMat);
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -60;
    scene.add(seafloor);

    // Effect Composer
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Add 4 shader passes like the original demo
    const makePass = (x, y) => {
      const pass = new ShaderPass(VergilWaterShader);
      pass.uniforms["centerX"].value = x;
      pass.uniforms["centerY"].value = y;
      return pass;
    };

    const effect1 = makePass(0.8, 0.8);
    const effect2 = makePass(0.2, 0.2);
    const effect3 = makePass(0.2, 0.8);
    const effect4 = makePass(0.8, 0.2);
    effect4.renderToScreen = true;

    composer.addPass(effect1);
    composer.addPass(effect2);
    composer.addPass(effect3);
    composer.addPass(effect4);

    // Scroll tracking
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);

      const scrollDepth = scrollY * 0.05;
      if (submarineRef.current) {
        submarineRef.current.position.y = -scrollDepth;
      }

      // Advance shader time for animation
      const timeDelta = Math.random() * 0.5;
      effect1.uniforms.time.value += timeDelta;
      effect2.uniforms.time.value += timeDelta;
      effect3.uniforms.time.value += timeDelta;
      effect4.uniforms.time.value += timeDelta;

      composer.render();
    };

    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mountRef.current.removeChild(renderer.domElement);
      composer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
};

export default OceanScene;
