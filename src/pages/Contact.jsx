export default function Contact() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
      <p className="text-gray-400 max-w-xl mb-6">
        Whether you have a project in mind, a collaboration idea, or just want to say hi — I’d love to hear from you.
      </p>

      <a
        href="mailto:your.email@example.com"
        className="text-xl text-blue-400 underline hover:text-blue-300 transition"
      >
        your.email@example.com
      </a>
    </section>
  );
}
