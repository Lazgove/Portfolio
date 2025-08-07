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
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_blobs: { value: blobs.map((b) => new THREE.Vector3(b.pos.x, b.pos.y, b.radius)) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      fragmentShader: metaballFragmentShader(NUM_BLOBS),
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = (t) => {
      uniforms.u_time.value = t / 1000;

      blobs.forEach((b, i) => {
        b.pos.add(b.vel);

        if (b.pos.x < 0 || b.pos.x > 1) b.vel.x *= -1;
        if (b.pos.y < 0 || b.pos.y > 1) b.vel.y *= -1;

        const dx = uniforms.u_mouse.value.x - b.pos.x;
        const dy = uniforms.u_mouse.value.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        const attractionRadius = 0.4;
        if (dist < attractionRadius) {
          const pullStrength = 0.00005 * (attractionRadius - dist);
          b.vel.x += (dx / dist) * pullStrength;
          b.vel.y += (dy / dist) * pullStrength;
        }

        b.vel.multiplyScalar(0.98);

        b.pos.x = Math.max(0, Math.min(1, b.pos.x));
        b.pos.y = Math.max(0, Math.min(1, b.pos.y));

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
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
};

const metaballFragmentShader = (numBlobs) => `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_blobs[${numBlobs}];

// Simple 1D noise based on sine for smooth blob distortion
float blobNoise(float x) {
  return 0.5 + 0.5 * sin(x);
}

float metaballField(vec2 uv) {
  float field = 0.0;
  for (int i = 0; i < ${numBlobs}; i++) {
    vec2 blobPos = u_blobs[i].xy;
    float r = u_blobs[i].z;

    float n = blobNoise(u_time * 0.5 + float(i) * 10.0); // Slow noise per blob
    float distortedRadius = r * (0.85 + 0.3 * n);

    float d = distance(uv, blobPos);
    field += (distortedRadius * distortedRadius) / (d * d + 0.001);
  }
  return field;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  vec3 background = mix(vec3(0.2, 0.3, 0.8), vec3(0.6, 0.2, 0.9), uv.y);

  float field = metaballField(uv);
  float threshold = 1.0;

  // Main metaball edge (solid area)
  float edge = step(threshold, field);

  // Shadow effect: sample the field with a slightly larger radius by offsetting UV in all directions
  float shadow = 0.0;
  float shadowRadius = 0.03; // controls how far the shadow spreads

  // Sample 8 directions around the current pixel for soft shadow
  for (int i = 0; i < 8; i++) {
    float angle = float(i) * 3.1415926 / 4.0;
    vec2 offset = vec2(cos(angle), sin(angle)) * shadowRadius;
    shadow += step(threshold, metaballField(uv + offset));
  }

  shadow = shadow / 8.0; // average shadow intensity around

  // Make shadow visible only just outside the metaball edge, so exclude inside the ball
  float shadowIntensity = smoothstep(0.0, 1.0, shadow) * (1.0 - edge);

  vec3 matteColor = vec3(0.9, 0.9, 0.95);
  vec3 shadowColor = vec3(0.0, 0.0, 0.0);

  float alpha = 0.35 * edge;

  // Combine shadow color with matte color blended by shadowIntensity
  vec3 finalColor = mix(background, matteColor, alpha);
  finalColor = mix(finalColor, shadowColor, 0.15 * shadowIntensity); // subtle shadow

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default MetaballBackground;
