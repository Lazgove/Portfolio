import WaterPlane from './WaterPlane';

export default function OceanScene() {
  return (
    <Canvas camera={{ position: [0, 10, 30], fov: 30, near: 0.1, far: 1000 }} shadows>
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 50, 50]} intensity={1.5} />

      <WaterPlane />

      {/* Seafloor */}
      <mesh position={[0, -100, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#8B7D5B" />
      </mesh>
    </Canvas>
  );
}
