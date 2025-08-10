export const waterVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vCoord;

  uniform float time;

  void main() {
    vNormal = normalMatrix * normal;

    // Add some wave movement by displacing vertices in vertex shader
    vec3 pos = position;
    float waveHeight = sin(pos.x * 0.1 + time) * 0.3 + cos(pos.y * 0.2 + time * 1.5) * 0.15;
    pos.z += waveHeight;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    vCoord = projectionMatrix * viewMatrix * worldPosition;

    gl_Position = vCoord;
  }
`;
