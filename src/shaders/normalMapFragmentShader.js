export const normalMapFragmentShader = `
  void main() {
    // Calculate screen-space derivatives to approximate normal
    vec3 dx = dFdx(gl_FragCoord.xyz);
    vec3 dy = dFdy(gl_FragCoord.xyz);
    vec3 normal = normalize(cross(dx, dy));

    // Encode normal in [0,1] for texture
    normal = normal * 0.5 + 0.5;

    gl_FragColor = vec4(normal, 1.0);
  }
`;