export const underwaterFragmentShader = `
  uniform float time;
  uniform vec3 cameraPosition;
  varying vec3 vWorldPosition;

  void main() {
    float depth = length(cameraPosition - vWorldPosition);

    // Simple blue fog fading with depth
    vec3 fogColor = vec3(0.0, 0.3, 0.5);
    float fogFactor = smoothstep(0.0, 100.0, depth);

    vec3 baseColor = vec3(0.0, 0.5, 0.7);

    // Caustics effect: animated sine pattern on the floor
    float caustics = sin(vWorldPosition.x * 10.0 + time * 5.0) * sin(vWorldPosition.z * 10.0 + time * 5.0);
    caustics = smoothstep(0.2, 0.8, caustics);

    vec3 color = mix(baseColor * caustics, fogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;