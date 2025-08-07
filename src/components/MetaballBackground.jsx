import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const MetaballBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);

    const NUM_BLOBS = 12;

    const blobs = Array.from({ length: NUM_BLOBS }, () => ({
      pos: new THREE.Vector2(Math.random(), Math.random()),
      vel: new THREE.Vector2(
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.002
      ),
      radius: 0.04 + Math.random() * 0.05,
    }));

    const uniforms = {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_blobs: {
        value: blobs.map((b) => new THREE.Vector3(b.pos.x, b.pos.y, b.radius)),
      },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      fragmentShader: metaballFragmentShader(NUM_BLOBS),
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = (t) => {
      uniforms.u_time.value = t / 1000;

      blobs.forEach((b, i) => {
        b.pos.add(b.vel);

        if (b.pos.x < 0) {
          b.pos.x = 0;
          b.vel.x *= -1;
        } else if (b.pos.x > 1) {
          b.pos.x = 1;
          b.vel.x *= -1;
        }
        if (b.pos.y < 0) {
          b.pos.y = 0;
          b.vel.y *= -1;
        } else if (b.pos.y > 1) {
          b.pos.y = 1;
          b.vel.y *= -1;
        }

        const dx = uniforms.u_mouse.value.x - b.pos.x;
        const dy = uniforms.u_mouse.value.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

        const mouseInfluenceRadius = 0.3;
        if (dist < mouseInfluenceRadius) {
          const falloff = (mouseInfluenceRadius - dist) / mouseInfluenceRadius;
          const attraction = 0.0001 * falloff;
          b.vel.x += (dx / dist) * attraction;
          b.vel.y += (dy / dist) * attraction;
        }

        b.vel.multiplyScalar(0.98);

        uniforms.u_blobs.value[i].set(b.pos.x, b.pos.y, b.radius);
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate(0);

    const handleMouseMove = (e) => {
      uniforms.u_mouse.value.set(e.clientX / width, 1 - e.clientY / height);
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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
        zIndex: -1,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
};

const metaballFragmentShader = (numBlobs) => `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_blobs[${numBlobs}];

// 2D random based on uv
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Value noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  // Background vertical linear gradient (bottom blue to top purple)
  vec3 bgBottom = vec3(0.165, 0.227, 0.624); // #2a3a9f
  vec3 bgTop = vec3(0.482, 0.302, 0.780); // #7b4dc7
  vec3 bgColor = mix(bgBottom, bgTop, uv.y);

  float field = 0.0;

  for (int i = 0; i < ${numBlobs}; i++) {
    vec2 blobPos = u_blobs[i].xy;
    float blobRadius = u_blobs[i].z;

    float noiseScale = 30.0;
    float noiseAmplitude = 0.015;

    float n = noise(blobPos * noiseScale + vec2(u_time * 0.3, u_time * 0.4));

    float dist = distance(uv, blobPos) + noiseAmplitude * (n - 0.5);

    field += (blobRadius * blobRadius) / (dist * dist);
  }

  float threshold = 1.0;
  float shadowThresholdLow = 0.8;

  // Main metaball fill (smooth edges)
  float metaball = smoothstep(threshold - 0.01, threshold + 0.01, field);

  // Shadow outside: alpha fades from 1 at shadowThresholdLow up to 0 at threshold
  float shadowAlpha = smoothstep(shadowThresholdLow, threshold, field);

  // Shadow color: black with subtle opacity
  vec3 shadowColor = vec3(0.0);

  // Shadow max opacity
  float shadowOpacity = 0.15;

  // Compose final color
  vec3 fillColor = vec3(1.0); // white metaball

  vec3 color = bgColor;

  // Add shadow outside metaball with reduced opacity
  color = mix(color, shadowColor, shadowAlpha * (1.0 - metaball) * shadowOpacity);

  // Add metaball fill on top
  color = mix(color, fillColor, metaball);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default MetaballBackground;
