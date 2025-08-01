import { motion } from 'framer-motion'

export default function Home() {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <h2 className="text-4xl font-bold mb-4">Welcome!</h2>
      <p>Here's a quick intro to my world of motion design & 3D.</p>
    </motion.section>
  )
}
