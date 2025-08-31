import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Scene } from './components/Scene'

export default function App() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50, near: 0.01, far: 100 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Scene />
      <OrbitControls />
    </Canvas>
  )
}
