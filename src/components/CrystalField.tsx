import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  alpha: number;
  phase: number;
  twinkle: number;
};

type Streak = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const CrystalField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const context = canvas?.getContext('2d', { alpha: true });

    if (!canvas || !parent || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const shouldAnimate = !reducedMotion;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let lastDraw = 0;
    let isVisible = true;
    let particles: Particle[] = [];
    let streaks: Streak[] = [];
    const frameInterval = isMobile ? 1000 / 18 : 1000 / 30;

    const makeParticle = (fromBottom = false): Particle => ({
      x: random(0, width),
      y: fromBottom ? height + random(12, 120) : random(0, height),
      vx: random(-0.08, 0.08),
      vy: -random(0.05, 0.22),
      size: random(0.7, 2.3),
      depth: random(0.35, 1),
      alpha: random(0.28, 0.9),
      phase: random(0, Math.PI * 2),
      twinkle: random(0.0016, 0.0045),
    });

    const makeStreak = (): Streak => ({
      x: random(-width * 0.2, width * 1.05),
      y: random(0, height),
      length: random(90, 220),
      speed: random(0.16, 0.42),
      angle: random(-0.42, -0.18),
      alpha: random(0.08, 0.18),
    });

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      width = Math.max(1, Math.floor(bounds.width));
      height = Math.max(1, Math.floor(bounds.height));
      dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const particleCount = isMobile
        ? Math.round(Math.min(52, Math.max(28, (width * height) / 18000)))
        : Math.round(Math.min(130, Math.max(56, (width * height) / 14000)));
      const streakCount = isMobile
        ? Math.round(Math.min(4, Math.max(2, width / 220)))
        : Math.round(Math.min(9, Math.max(4, width / 190)));
      particles = Array.from({ length: particleCount }, () => makeParticle());
      streaks = Array.from({ length: streakCount }, () => makeStreak());

      if (!shouldAnimate) draw(0);
    };

    const drawParticle = (particle: Particle, time: number) => {
      const pulse = 0.45 + 0.55 * Math.sin(time * particle.twinkle + particle.phase);
      const alpha = particle.alpha * (0.48 + pulse * 0.42);
      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 7);

      glow.addColorStop(0, `rgba(246, 211, 122, ${alpha * 0.58})`);
      glow.addColorStop(0.45, `rgba(184, 135, 23, ${alpha * 0.24})`);
      glow.addColorStop(1, 'rgba(184, 135, 23, 0)');

      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * 7, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(Math.PI / 4 + time * 0.00004 * particle.depth);
      context.fillStyle = `rgba(255, 245, 196, ${alpha})`;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      context.restore();
    };

    const drawConnections = () => {
      const maxDistance = Math.min(140, Math.max(82, width / 9));
      const maxDistanceSq = maxDistance * maxDistance;

      context.lineWidth = 0.55;

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const first = particles[i];
          const second = particles[j];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq > maxDistanceSq) continue;

          const distance = Math.sqrt(distanceSq);
          const opacity = (1 - distance / maxDistance) * 0.26 * Math.min(first.depth, second.depth);
          const gradient = context.createLinearGradient(first.x, first.y, second.x, second.y);

          gradient.addColorStop(0, `rgba(246, 211, 122, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.65})`);
          gradient.addColorStop(1, `rgba(184, 135, 23, ${opacity})`);

          context.strokeStyle = gradient;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
    };

    const drawStreaks = () => {
      context.lineWidth = 1;

      streaks.forEach((streak) => {
        const endX = streak.x + Math.cos(streak.angle) * streak.length;
        const endY = streak.y + Math.sin(streak.angle) * streak.length;
        const gradient = context.createLinearGradient(streak.x, streak.y, endX, endY);

        gradient.addColorStop(0, 'rgba(246, 211, 122, 0)');
        gradient.addColorStop(0.45, `rgba(246, 211, 122, ${streak.alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(streak.x, streak.y);
        context.lineTo(endX, endY);
        context.stroke();
      });
    };

    const update = () => {
      particles.forEach((particle) => {
        particle.x += particle.vx * particle.depth;
        particle.y += particle.vy * particle.depth;

        if (particle.y < -24 || particle.x < -36 || particle.x > width + 36) {
          Object.assign(particle, makeParticle(true));
        }
      });

      streaks.forEach((streak) => {
        streak.x += streak.speed;
        streak.y -= streak.speed * 0.34;

        if (streak.x > width + streak.length || streak.y < -streak.length) {
          Object.assign(streak, makeStreak(), {
            x: random(-width * 0.35, width * 0.15),
            y: height + random(0, 180),
          });
        }
      });
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = 'lighter';
      drawStreaks();
      drawConnections();
      particles.forEach((particle) => drawParticle(particle, time));
      context.restore();
    };

    const render = (time = 0) => {
      if (!isVisible || document.hidden) {
        frame = 0;
        return;
      }
      if (time - lastDraw >= frameInterval) {
        update();
        draw(time);
        lastDraw = time;
      }
      frame = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (!shouldAnimate || frame || !isVisible || document.hidden) return;
      frame = window.requestAnimationFrame(render);
    };

    const stop = () => {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const observer = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start();
      else stop();
    }, { rootMargin: '200px' });

    observer.observe(parent);
    intersectionObserver.observe(canvas);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resize();
    start();

    return () => {
      observer.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stop();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="crystal-field" />;
};

export default CrystalField;
