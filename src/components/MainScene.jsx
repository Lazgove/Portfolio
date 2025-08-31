import * as THREE from 'three'
import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Html, OrbitControls, Environment } from '@react-three/drei'
import HeroPage from './HeroPage'

export default function MainScene(props) {
  const group = useRef()
  const { nodes, materials } = useGLTF('/models/scene.glb')
  console.log(nodes)

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Now your screen placeholder */}
      <mesh geometry={nodes.screen_mesh.geometry} material={materials.screen}>
        {/* This is where the HTML screen goes */}
        <Html
          transform
          occlude
          position={[0, 0, 0]}         // tweak to match the plane depth
          rotation-x={-Math.PI / 2}    // tweak until it’s flush with screen
        >
          <div className="screen-wrapper" onPointerDown={(e) => e.stopPropagation()}>
            <HeroPage />
          </div>
        </Html>
      </mesh>
    </group>
  )
}
