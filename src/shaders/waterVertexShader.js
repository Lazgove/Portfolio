export const waterVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vCoord;

  void main() {
    vNormal = normalMatrix * normal;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vCoord = modelViewMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * vCoord;
  }
`;
