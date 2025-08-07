import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const MetaballBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const NUM_BLOBS = 8;
    const blobs = Array.from({ length: NUM_BLOBS }, () => ({
      pos: new THREE.Vector2(Math.random(), Math.random()),
      vel: new THREE.Vector2(
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.002
      ),
      radius: 0.1 + Math.random() * 0.05,
    }));

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_blobs: { value: blobs.map((b) => new THREE.Vector3(b.pos.x, b.pos.y, b.radius)) },
      u_mouse: { value: new THREE.Vector2(0, 0) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms,
      fragmentShader: `
        precision highp float;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_blobs[${NUM_BLOBS}];
        uniform vec2 u_mouse;

        // Original value noise functions
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);

          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));

          vec2 u = f * f * (3.0 - 2.0 * f);

          return mix(a, b, u.x) +
                 (c - a) * u.y * (1.0 - u.x) +
                 (d - b) * u.x * u.y;
        }

        float metaballField(vec2 uv) {
          float field = 0.0;
          for (int i = 0; i < ${NUM_BLOBS}; i++) {
            vec2 blobPos = u_blobs[i].xy;

            // Bigger & slower noise displacement using original noise
            float n = noise(blobPos * 5.0 + u_time * 0.2);
            float angle = n * 6.2831;
            float displacement = 0.07;
            vec2 noiseOffset = vec2(cos(angle), sin(angle)) * displacement;

            // Mouse influence
            vec2 mouseDir = normalize(u_mouse - blobPos);
            float mouseDist = distance(u_mouse, blobPos);
            float mouseInfluence = smoothstep(0.4, 0.0, mouseDist);

            blobPos += noiseOffset + mouseDir * mouseInfluence * 0.05;

            float r = u_blobs[i].z;
            float d = distance(uv, blobPos);
            field += (r * r) / (d * d + 0.001);
          }
          return field;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;

          // Gradient background: from blue to purple
          vec3 bgColor = mix(vec3(0.2, 0.3, 0.8), vec3(0.6, 0.2, 0.9), uv.y);

          float field = metaballField(uv);
          float alpha = smoothstep(0.9, 1.0, field);

          // Frosted matte color (slightly bluish white)
          vec3 matteColor = vec3(0.95, 0.97, 1.0);

          // Add subtle noise for frosted look with original noise
          float noiseVal = random(uv * u_resolution.xy + u_time * 10.0);
          matteColor += (noiseVal - 0.5) * 0.05;

          // Final blend
          vec3 finalColor = mix(bgColor, matteColor, alpha);
          float finalAlpha = alpha * 0.35;

          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse move handler
    const onMouseMove = (e) => {
      const x = e.clientX / width;
      const y = 1 - e.clientY / height; // flip Y for shader UV coords
      uniforms.u_mouse.value.set(x, y);
    };
    window.addEventListener("mousemove", onMouseMove);

    const animate = (t) => {
      uniforms.u_time.value = t / 1000;

      blobs.forEach((b, i) => {
        b.pos.add(b.vel);
        if (b.pos.x < 0 || b.pos.x > 1) b.vel.x *= -1;
        if (b.pos.y < 0 || b.pos.y > 1) b.vel.y *= -1;

        b.vel.multiplyScalar(0.98);
        b.pos.x = Math.max(0, Math.min(1, b.pos.x));
        b.pos.y = Math.max(0, Math.min(1, b.pos.y));

        uniforms.u_blobs.value[i].set(b.pos.x, b.pos.y, b.radius);
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -2,
        background: "linear-gradient(to bottom, #3449db, #8a2be2)", // blue to purple
      }}
    >
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default MetaballBackground;
