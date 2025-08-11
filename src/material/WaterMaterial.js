import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Your shader strings imports here
import { waterVertexShader } from '../shaders/waterVertexShader.js';
import { waterFragmentShader } from '../shaders/waterFragmentShader.js';
import { perturbNormal2Arb } from '../shaders/perturbNormal2Arb.js';
import { simplex3d } from '../shaders/simplex3d.js';
import { snoise } from '../shaders/snoise.js';

const vertexShader = `
  ${simplex3d}
  ${snoise}
  ${perturbNormal2Arb}
  ${waterVertexShader}
`;

const fragmentShader = `
  ${perturbNormal2Arb}
  ${waterFragmentShader}
`;

const WaterMaterial = shaderMaterial(
  {
    time: 0,
    cameraPosition: new THREE.Vector3(),
    lightDirection: new THREE.Vector3(0.5, 0.8, 0.1).normalize(),
    waterColor: new THREE.Color(0x001e0f),
    distortionScale: 3.7,
    size: 1.0,
  },
  vertexShader,
  fragmentShader
);

// **THIS IS IMPORTANT**: extend with the exact class name
extend({ WaterMaterial });
export default WaterMaterial;
