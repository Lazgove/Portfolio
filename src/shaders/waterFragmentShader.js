export const waterFragmentShader = `
  uniform sampler2D reflectionTexture;
  uniform sampler2D refractionTexture;
  uniform sampler2D normalMap;
  uniform float time;
  uniform vec3 uCameraPosition;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vCoord;

  void main() {
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Simple Fresnel term
    float fresnel = pow(1.0 - dot(normalize(vNormal), viewDir), 3.0);

    // Distort UVs for reflection/refraction using normal map + time for animation
    vec2 uv = gl_FragCoord.xy / vec2(1024.0, 1024.0);
    vec3 normalTex = texture2D(normalMap, uv + vec2(time * 0.05, time * 0.05)).rgb;
    vec2 distortion = (normalTex.xy * 2.0 - 1.0) * 0.05;

    vec2 reflUV = uv + distortion;
    vec2 refrUV = uv - distortion;

    vec3 reflection = texture2D(reflectionTexture, reflUV).rgb;
    vec3 refraction = texture2D(refractionTexture, refrUV).rgb;

    vec3 color = mix(refraction, reflection, fresnel);

    gl_FragColor = vec4(color, 1.0);
  }
`;
