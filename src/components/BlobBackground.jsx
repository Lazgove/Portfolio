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

    const numLines = 12;
    const lineSpacing = height / numLines;
    const speed = 0.02;

    let time = 0;

    function drawLine(yOffset, amplitude, frequency, phase) {
      ctx.beginPath();

      for (let x = 0; x <= width; x += 2) {
        const y =
          yOffset +
          Math.sin((x * frequency) + time + phase) * amplitude +
          Math.sin((x * frequency * 0.5) + time * 0.5 + phase) * amplitude * 0.5;

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 12; // Much thicker lines
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 20;
      ctx.stroke();
    }

    function drawBackgroundGradient() {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#ff9a9e');
      gradient.addColorStop(0.5, '#fad0c4');
      gradient.addColorStop(1, '#fbc2eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    function animate() {
      time += speed;

      drawBackgroundGradient();

      for (let i = 0; i < numLines; i++) {
        const y = i * lineSpacing + lineSpacing / 2;
        const amp = 40 + Math.sin(time + i) * 20; // More wobble
        const freq = 0.01 + (i % 3) * 0.002;      // Different frequencies
        drawLine(y, amp, freq, i);
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
