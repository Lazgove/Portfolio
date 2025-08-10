export const reflectionFragmentShader = `
  uniform sampler2D sceneTexture;

  void main() {
    vec2 uv = gl_FragCoord.xy / vec2(1024.0, 1024.0);
    gl_FragColor = texture2D(sceneTexture, uv);
  }
`;