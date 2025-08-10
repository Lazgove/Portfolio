export const waterVertexShader = `
  uniform float time;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vCoord;

  void main() {
    vNormal = normalMatrix * normal;
    vec3 pos = position;

    // Simple wave displacement example
    pos.z += sin(pos.x * 0.1 + time) * 0.5;
    pos.z += cos(pos.y * 0.15 + time * 1.5) * 0.3;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    vCoord = projectionMatrix * viewMatrix * worldPosition;

    gl_Position = vCoord;
  }
`;
