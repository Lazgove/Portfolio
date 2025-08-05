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

    const numBlobs = 6;
    const blobs = Array.from({ length: numBlobs }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 100 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.003
    }));

    function drawGradientBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#ff9a9e');
      gradient.addColorStop(1, '#fad0c4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    function drawBlob(blob, t) {
      const points = 60;
      const step = (Math.PI * 2) / points;

      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = i * step;
        const offset =
          Math.sin(angle * 3 + t * blob.speed + blob.phase) * blob.r * 0.3;
        const radius = blob.r + offset;
        const x = blob.x + Math.cos(angle) * radius;
        const y = blob.y + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let t = 0;

    function animate() {
      drawGradientBackground();

      blobs.forEach((blob) => {
        drawBlob(blob, t);
      });

      t += 1;
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
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default BlobBackground;
