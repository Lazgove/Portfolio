import { useEffect, useRef } from 'react';

const WavyBackground = () => {
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

    const numLines = 10;
    const lineSpacing = height / numLines;
    const speed = 0.002;

    let time = 0;

    function drawLine(yOffset, waveHeight, freq, phase) {
      ctx.beginPath();
      const amplitude = waveHeight;
      const wavelength = width / freq;

      for (let x = 0; x <= width; x += 10) {
        const y = yOffset + Math.sin((x * 0.01) + time + phase) * amplitude;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    function drawBackgroundGradient() {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#c471f5');
      gradient.addColorStop(1, '#fa71cd');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    function animate() {
      time += speed;

      // Background
      drawBackgroundGradient();

      // Lines
      for (let i = 0; i < numLines; i++) {
        const y = i * lineSpacing + lineSpacing / 2;
        const waveHeight = 20 + Math.sin(time + i) * 10;
        drawLine(y, waveHeight, 2 + (i % 3), i);
      }

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

export default WavyBackground;
