export const normalMapVertexShader = `
  uniform float time;

  void main() {
    vec3 pos = position;

    // Wave displacement similar to main water vertex shader
    float wave1 = sin(pos.x * 0.3 + time * 1.2) * 0.4;
    float wave2 = cos(pos.y * 0.5 + time * 1.5) * 0.2;
    float wave3 = sin((pos.x + pos.y) * 0.7 + time) * 0.1;
    pos.z += wave1 + wave2 + wave3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;