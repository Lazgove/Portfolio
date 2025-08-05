import { useEffect, useRef } from 'react';

const BlobBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const numBlobs = 10;

    const blobs = Array.from({ length: numBlobs }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 100 + Math.random() * 50,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      color1: `hsl(${Math.random() * 360}, 80%, 60%)`,
      color2: `hsl(${Math.random() * 360}, 80%, 80%)`
    }));

    function drawBlob(blob) {
      const gradient = ctx.createRadialGradient(blob.x, blob.y, blob.r * 0.2, blob.x, blob.y, blob.r);
      gradient.addColorStop(0, blob.color1);
      gradient.addColorStop(1, blob.color2);

      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = blob.color1;
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      blobs.forEach(blob => {
        blob.x += blob.dx;
        blob.y += blob.dy;

        // Bounce off walls
        if (blob.x - blob.r < 0 || blob.x + blob.r > width) blob.dx *= -1;
        if (blob.y - blob.r < 0 || blob.y + blob.r > height) blob.dy *= -1;

        drawBlob(blob);
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default BlobBackground;
