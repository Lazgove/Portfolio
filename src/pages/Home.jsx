import BoxScene from "../components/BoxScene" // adjust the path if needed

export default function Home() {
  return (
    <section className="text-center">
      <h2 className="text-4xl font-bold mb-4">Welcome to my portfolio!</h2>
      <p className="text-lg text-gray-600">Discover my work in motion design and 3D.</p>

      {/* Add your 3D scene here */}
      <div className="mt-8" style={{ height: "400px" }}>
        <BoxScene />
      </div>
    </section>
  )
}
