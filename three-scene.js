import * as THREE from 'three'

const canvas = document.getElementById('three-canvas')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / 400, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ canvas })

renderer.setSize(canvas.clientWidth, 400)

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0x00ff99, wireframe: true })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 3

function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}

animate()
