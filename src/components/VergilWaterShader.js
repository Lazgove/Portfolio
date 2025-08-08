export const VergilWaterShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "time": { value: 0.0 },
    "centerX": { value: 0.5 },
    "centerY": { value: 0.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float centerX;
    uniform float centerY;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(centerX, centerY);
      float dist = distance(uv, center);
      if (dist < 0.5) {
        float scale = 0.03 * sin(time * 0.1 + dist * 50.0);
        uv.x += (uv.x - center.x) * scale;
        uv.y += (uv.y - center.y) * scale;
      }
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
};
