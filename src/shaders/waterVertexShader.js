export const waterVertexShader = `
  uniform float time;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vNormal = normal;

    vec3 pos = position;

    // Layered sine waves for displacement
    float wave1 = sin(pos.x * 0.3 + time * 1.2) * 0.4;
    float wave2 = cos(pos.y * 0.5 + time * 1.5) * 0.2;
    float wave3 = sin((pos.x + pos.y) * 0.7 + time) * 0.1;
    pos.z += wave1 + wave2 + wave3;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;