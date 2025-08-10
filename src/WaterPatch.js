import {
  BackSide,
  Color,
  DataTexture,
  FloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  PlaneBufferGeometry,
  RGBFormat,
  ShaderMaterial,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three';

const WaterShader = {

  vertexShader: `#version 300 es
  precision highp float;

  in vec3 position;
  in vec2 uv;

  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  uniform float time;
  uniform vec2 distortionScale;

  out vec2 vUv;
  out vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,

  fragmentShader: `#version 300 es
  precision highp float;

  uniform sampler2D waterNormals;
  uniform vec3 sunDirection;
  uniform vec3 sunColor;
  uniform vec3 waterColor;
  uniform float distortionScale;
  uniform float time;

  in vec2 vUv;
  out vec4 fragColor;

  void main() {
    vec2 uv = vUv;

    // Animate the water normals texture coordinates by time to simulate movement
    vec4 normalColor = texture(waterNormals, uv * 10.0 + vec2(time * 0.05, time * 0.1));
    vec3 normal = normalize(normalColor.rgb * 2.0 - 1.0);

    // Simple lighting based on sun direction
    float light = max(dot(normal, sunDirection), 0.0);
    vec3 diffuse = sunColor * light;

    vec3 color = waterColor + diffuse * distortionScale;

    fragColor = vec4(color, 1.0);
  }
  `,
};

class Water extends Mesh {

  constructor(renderer, options = {}) {
    const geometry = options.geometry || new PlaneBufferGeometry(1000, 1000);

    // Setup render target for normal map
    const renderTarget = new WebGLRenderTarget(512, 512, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBFormat,
      type: FloatType,
      stencilBuffer: false,
      depthBuffer: false,
    });

    // Create a simple data texture as fallback water normals if none provided
    const waterNormals = options.texture || new DataTexture(new Uint8Array([128, 128, 255]), 1, 1, RGBFormat);
    waterNormals.wrapS = waterNormals.wrapT = 1000; // repeat wrapping

    const uniforms = UniformsUtils.merge([
      {
        time: { value: 0 },
        distortionScale: { value: options.distortionScale || 20.0 },
        waterNormals: { value: waterNormals },
        sunColor: { value: new Color(0xffffff) },
        sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
        waterColor: { value: new Color(0x001e0f) },
      }
    ]);

    const material = new ShaderMaterial({
      vertexShader: WaterShader.vertexShader,
      fragmentShader: WaterShader.fragmentShader,
      uniforms,
      transparent: true,
      side: BackSide,
    });

    super(geometry, material);

    this.isWater = true;
    this.material = material;
    this.renderer = renderer;
  }

  update(time) {
    this.material.uniforms.time.value = time;
  }

}

export { Water };
