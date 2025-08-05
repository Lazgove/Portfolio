export default function BlobBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Blob 1 */}
      <div
        className="absolute w-[600px] h-[600px] top-[-150px] left-[-150px] 
        rounded-full filter blur-2xl 
        bg-gradient-to-tr from-pink-400 via-red-400 to-yellow-300 
        opacity-30 animate-blob"
        style={{ animationDelay: '0s' }}
      />

      {/* Blob 2 */}
      <div
        className="absolute w-[500px] h-[500px] top-1/3 left-1/2 
        rounded-full filter blur-2xl 
        bg-gradient-to-tr from-blue-400 via-indigo-400 to-purple-400 
        opacity-25 animate-blob"
        style={{ animationDelay: '2s' }}
      />

      {/* Blob 3 */}
      <div
        className="absolute w-[700px] h-[700px] bottom-[-200px] right-[-200px] 
        rounded-full filter blur-2xl 
        bg-gradient-to-tr from-green-300 via-teal-300 to-cyan-300 
        opacity-20 animate-blob"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
