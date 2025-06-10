// Carga particles.js solo en cliente y lo inicializa
export async function initParticles(containerId: string) {
  if (typeof window === 'undefined') return;      // SSR-safe

  // Carga dinámica (solo se ejecuta una vez)
  await import('particles.js');

  // particlesJS queda disponible en window
  const particlesJS = (window as any).particlesJS as (
    id: string,
    config: any,
  ) => void;

  if (!particlesJS) {
    console.error('particlesJS no está disponible');
    return;
  }

  particlesJS(containerId, {
    particles: {
      number: { value: 110, density: { enable: true, value_area: 900 } },
      color:  { value: '#FFFFFF' },        // puntos blancos
      shape:  { type: 'circle' },
      size:   { value: 3, random: true },
      opacity:{ value: 0.5 },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#FFCC00',                 // líneas doradas
        opacity: 0.5,
        width: 1.2,
      },
      move: { enable: true, speed: 3 },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' },
      },
      modes: {
        repulse: { distance: 120, duration: 0.4 },
        push:    { particles_nb: 4 },
      },
    },
    retina_detect: true,
  });
}
