// BoxScene.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";

function Box() {
  return (
    <mesh rotation={[0.4, 0.2, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function BoxScene() {
  return (
    <Canvas style={{ height: "100vh", background: "lightblue" }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box />
    </Canvas>
  );
}
