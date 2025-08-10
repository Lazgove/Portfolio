export const waterFragmentShader = `
  uniform sampler2D reflectionTexture;
  uniform sampler2D refractionTexture;
  uniform sampler2D normalMap;
  uniform float time;
  uniform vec3 uCameraPosition;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Fresnel effect for reflection intensity
    float fresnel = pow(1.0 - dot(normalize(vNormal), viewDir), 3.0);

    // Sample normal map for additional distortion
    vec2 normalUv = vUv + vec2(time * 0.05, time * 0.05);
    vec3 normalTex = texture2D(normalMap, normalUv).rgb;
    vec2 distortion = (normalTex.xy * 2.0 - 1.0) * 0.05;

    // Distort UVs for reflection/refraction textures
    vec2 reflUV = vUv + distortion;
    vec2 refrUV = vUv - distortion;

    // Sample reflection and refraction textures
    vec3 reflection = texture2D(reflectionTexture, reflUV).rgb;
    vec3 refraction = texture2D(refractionTexture, refrUV).rgb;

    // Combine reflection and refraction with fresnel
    vec3 waterColor = mix(refraction, reflection, fresnel);

    // Add some subtle water tint
    vec3 tint = vec3(0.0, 0.3, 0.5);
    waterColor = mix(waterColor, tint, 0.2);

    gl_FragColor = vec4(waterColor, 1.0);
  }
`;
