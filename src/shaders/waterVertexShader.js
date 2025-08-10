export const waterVertexShader = `
  uniform float time;
  uniform float waveAmplitude;
  uniform float waveFrequency;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  // Simple 2D sine wave function for vertex displacement
  float waveHeight(vec2 pos) {
    float wave1 = sin(pos.x * waveFrequency + time * 2.0);
    float wave2 = cos(pos.y * waveFrequency * 1.5 + time * 1.5);
    float wave3 = sin((pos.x + pos.y) * waveFrequency * 0.7 + time * 1.0);
    return (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * waveAmplitude;
  }

  void main() {
    vUv = uv;

    // Compute wave displacement on the vertex z-axis (assuming plane in XY)
    vec3 pos = position;
    float displacement = waveHeight(pos.xz);
    pos.z += displacement;

    // Compute world position and normal
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    // Approximate normal by finite differences (for more precise normals consider normal maps)
    float delta = 0.1;
    float heightL = waveHeight(pos.xz - vec2(delta, 0.0));
    float heightR = waveHeight(pos.xz + vec2(delta, 0.0));
    float heightD = waveHeight(pos.xz - vec2(0.0, delta));
    float heightU = waveHeight(pos.xz + vec2(0.0, delta));

    vec3 normal = normalize(vec3(heightL - heightR, 2.0 * delta, heightD - heightU));
    vNormal = normalize(normalMatrix * normal);

    vViewPosition = (viewMatrix * worldPos).xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
