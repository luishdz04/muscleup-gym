'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// ==========================================
// 🎯 CONFIGURACIÓN - TEXTOS ACTUALIZADOS
// ==========================================

const heroContent = {
  loading: "Cargando...",
  intro: {
    title: "Muscle Up GYM",
    subtitle: "Forma parte de la familia Muscle Up GYM",
    description: "El viaje comienza aquí",
    scroll: "Tu salud y bienestar es nuestra misión"
  },
  sections: [
    {
      main: "Son como gimnasios normales...",
      sub: "Listo para darlo todo, sin fallas ni pausas..."
    },
    {
      main: "...excepto que te transforman completamente.",
      sub: "No se trata del gimnasio..."
    },
    {
      main: "¡En serio!",
      sub: "...se trata de construir tu mejor versión"
    },
    {
      main: "Te hacen volar hacia tus metas.",
      sub: "Cada gota de sudor te acerca a tus metas"
    },
    {
      main: "¡De verdad!",
      sub: "Transforma el \"no puedo\" en lo haré"
    },
    {
      main: "Desafiando todos los límites conocidos.",
      sub: "La disciplina vence al talento cuando el talento no es disciplinado"
    },
    {
      main: "¡Es pura magia!",
      sub: "¡No te rindas!"
    }
  ],
  blueprint: {
    intro: {
      title: "Los hechos y las cifras.",
      subtitle: "DISEÑA TU ÉXITO",
      description: "Entrenamientos científicamente probados para resultados reales"
    },
    sections: [
      { 
        title: "Fuerza.", 
        subtitle: "RESISTENCIA MENTAL",
        description: "Supera tus propios récords cada semana" 
      },
      { 
        title: "Resistencia", 
        subtitle: "POTENCIA TOTAL",
        description: "Convierte lo imposible en tu calentamiento" 
      },
      { 
        title: "Músculo Izquierdo", 
        subtitle: "CONSTANCIA DIARIA",
        description: "La rutina constante es el secreto de los campeones" 
      },
      { 
        title: "Cardio", 
        subtitle: "VOLUNTAD INQUEBRANTABLE",
        description: "Tu mente es el músculo más poderoso que entrenarás" 
      }
    ]
  },
  end: {
    title: "Fin.",
    subtitle: "¿LISTO PARA REDEFINIR TUS LÍMITES?"
  }
};

// ==========================================
// 🎨 SCENE CLASS
// ==========================================

class Scene {
  views: Array<{ bottom: number; height: number; camera?: THREE.PerspectiveCamera }>;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  light: THREE.PointLight;
  softLight: THREE.AmbientLight;
  modelGroup: THREE.Group;
  w: number = 0;
  h: number = 0;

  constructor(model: THREE.Group, canvas: HTMLCanvasElement) {
    this.views = [
      { bottom: 0, height: 1 },
      { bottom: 0, height: 0 }
    ];

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();

    for (let ii = 0; ii < this.views.length; ++ii) {
      const view = this.views[ii];
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.fromArray([0, 0, 180]);
      camera.layers.disableAll();
      camera.layers.enable(ii);
      view.camera = camera;
      camera.lookAt(new THREE.Vector3(0, 5, 0));
    }

    this.light = new THREE.PointLight(0xffffff, 0.75);
    this.light.position.z = 150;
    this.light.position.x = 70;
    this.light.position.y = -20;
    this.scene.add(this.light);

    this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(this.softLight);

    this.onResize();
    window.addEventListener('resize', this.onResize, false);

    let edges: THREE.EdgesGeometry | undefined;
    if (model.children.length > 0) {
      const firstChild = model.children[0] as THREE.Mesh;
      if (firstChild && firstChild.geometry) {
        edges = new THREE.EdgesGeometry(firstChild.geometry);
      }
    }

    this.modelGroup = new THREE.Group();
    model.layers.set(0);
    
    if (edges) {
      const line = new THREE.LineSegments(edges);
      const lineMaterial = line.material as THREE.LineBasicMaterial;
      lineMaterial.depthTest = false;
      lineMaterial.opacity = 0.5;
      lineMaterial.transparent = true;
      line.position.x = 0.5;
      line.position.z = -1;
      line.position.y = 0.2;
      line.layers.set(1);
      this.modelGroup.add(line);
    }

    this.modelGroup.add(model);
    this.scene.add(this.modelGroup);
  }

  render = () => {
    for (let ii = 0; ii < this.views.length; ++ii) {
      const view = this.views[ii];
      const camera = view.camera!;

      const bottom = Math.floor(this.h * view.bottom);
      const height = Math.floor(this.h * view.height);

      this.renderer.setViewport(0, 0, this.w, this.h);
      this.renderer.setScissor(0, bottom, this.w, height);
      this.renderer.setScissorTest(true);

      camera.aspect = this.w / this.h;
      this.renderer.render(this.scene, camera);
    }
  };

  onResize = () => {
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    for (let ii = 0; ii < this.views.length; ++ii) {
      const view = this.views[ii];
      const camera = view.camera!;
      camera.aspect = this.w / this.h;
      let camZ = (screen.width - (this.w * 1)) / 3;
      camera.position.z = camZ < 180 ? 180 : camZ;
      camera.updateProjectionMatrix();
    }

    this.renderer.setSize(this.w, this.h);
    this.render();
  };
}

// ==========================================
// 🎨 COMPONENTE PRINCIPAL
// ==========================================

export default function AnimatedHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadModel = async () => {
    if (typeof window === 'undefined') return;

    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');

    gsap.registerPlugin(ScrollTrigger);
    
    try {
      const { DrawSVGPlugin } = await import('gsap/DrawSVGPlugin');
      gsap.registerPlugin(DrawSVGPlugin);
      gsap.set('#line-length', { drawSVG: 0 });
      gsap.set('#line-wingspan', { drawSVG: 0 });
      gsap.set('#circle-phalange', { drawSVG: 0 });
    } catch (e) {
      console.log('DrawSVG plugin not available');
    }

    let object: THREE.Group;

    const onModelLoaded = () => {
      object.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = new THREE.MeshPhongMaterial({ 
            color: 0x171511, 
            specular: 0xD0CBC7, 
            shininess: 5, 
            flatShading: true 
          });
          mesh.material = mat;
        }
      });

      setupAnimation(object);
    };

    const manager = new THREE.LoadingManager(onModelLoaded);
    const loader = new OBJLoader(manager);
    
    loader.load('https://assets.codepen.io/557388/1405+Plane_1.obj', (obj) => {
      object = obj;
    });
  };

  const setupAnimation = async (model: THREE.Group) => {
    if (!canvasRef.current || !contentRef.current) return;

    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');

    const scene = new Scene(model, canvasRef.current);
    const plane = scene.modelGroup;

    gsap.set(canvasRef.current, { autoAlpha: 0 });
    gsap.to('.loading', { autoAlpha: 0 });
    gsap.to('.scroll-cta', { opacity: 1 });
    gsap.set('svg', { autoAlpha: 1 });

    const tau = Math.PI * 2;

    gsap.set(plane.rotation, { y: tau * -0.25 });
    gsap.set(plane.position, { x: 80, y: -32, z: -60 });

    scene.render();

    // Hacer aparecer el canvas cuando la sección esté visible
    ScrollTrigger.create({
      trigger: contentRef.current,
      start: "top bottom",
      onEnter: () => {
        gsap.to(canvasRef.current, { duration: 1, autoAlpha: 1 });
      },
      onLeaveBack: () => {
        gsap.to(canvasRef.current, { duration: 0.5, autoAlpha: 0 });
      }
    });

    // Hacer desaparecer el avión antes de la última sección
    ScrollTrigger.create({
      trigger: ".sunset",
      start: "top center",
      onEnter: () => {
        gsap.to(canvasRef.current, { duration: 1, autoAlpha: 0 });
      },
      onLeaveBack: () => {
        gsap.to(canvasRef.current, { duration: 1, autoAlpha: 1 });
      }
    });

    // Views animation for blueprint section
    gsap.fromTo(scene.views[1], 
      { height: 1, bottom: 0 }, 
      {
        height: 0, bottom: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: ".blueprint",
          scrub: true,
          start: "bottom bottom",
          end: "bottom top"
        }
      }
    );

    gsap.fromTo(scene.views[1], 
      { height: 0, bottom: 0 }, 
      {
        height: 1, bottom: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: ".blueprint",
          scrub: true,
          start: "top bottom",
          end: "top top"
        }
      }
    );

    // Ground parallax
    gsap.to('.ground', {
      y: "30%",
      scrollTrigger: {
        trigger: ".ground-container",
        scrub: true,
        start: "top bottom",
        end: "bottom top"
      }
    });

    gsap.from('.clouds', {
      y: "25%",
      scrollTrigger: {
        trigger: ".ground-container",
        scrub: true,
        start: "top bottom",
        end: "bottom top"
      }
    });

    // SVG animations
    try {
      gsap.to('#line-length', {
        drawSVG: 100,
        scrollTrigger: {
          trigger: ".length",
          scrub: true,
          start: "top bottom",
          end: "top top"
        }
      });

      gsap.to('#line-wingspan', {
        drawSVG: 100,
        scrollTrigger: {
          trigger: ".wingspan",
          scrub: true,
          start: "top 25%",
          end: "bottom 50%"
        }
      });

      gsap.to('#circle-phalange', {
        drawSVG: 100,
        scrollTrigger: {
          trigger: ".phalange",
          scrub: true,
          start: "top 50%",
          end: "bottom 100%"
        }
      });

      gsap.to('#line-length', {
        opacity: 0,
        drawSVG: 0,
        scrollTrigger: {
          trigger: ".length",
          scrub: true,
          start: "top top",
          end: "bottom top"
        }
      });

      gsap.to('#line-wingspan', {
        opacity: 0,
        drawSVG: 0,
        scrollTrigger: {
          trigger: ".wingspan",
          scrub: true,
          start: "top top",
          end: "bottom top"
        }
      });

      gsap.to('#circle-phalange', {
        opacity: 0,
        drawSVG: 0,
        scrollTrigger: {
          trigger: ".phalange",
          scrub: true,
          start: "top top",
          end: "bottom top"
        }
      });
    } catch (e) {
      console.log('DrawSVG animations skipped');
    }

    // Timeline principal ajustado para terminar antes del final
    const tl = gsap.timeline({
      onUpdate: scene.render,
      scrollTrigger: {
        trigger: contentRef.current,
        scrub: true,
        start: "top bottom",
        end: "bottom bottom",
        endTrigger: ".blueprint" // Termina en la sección blueprint
      },
      defaults: { duration: 1, ease: 'power2.inOut' }
    });

    let delay = 0;

    tl.to('.scroll-cta', { duration: 0.25, opacity: 0 }, delay);
    tl.to(plane.position, { x: -10, ease: 'power1.in' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.05, ease: 'power1.inOut' }, delay);
    tl.to(plane.position, { x: -40, y: 0, z: -60, ease: 'power1.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.25, y: 0, z: tau * 0.05, ease: 'power3.inOut' }, delay);
    tl.to(plane.position, { x: 40, y: 0, z: -60, ease: 'power2.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.2, y: 0, z: -tau * 0.1, ease: 'power3.inOut' }, delay);
    tl.to(plane.position, { x: -40, y: 0, z: -30, ease: 'power2.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: 0, z: 0, y: tau * 0.25 }, delay);
    tl.to(plane.position, { x: 0, y: -10, z: 50 }, delay);

    delay += 1;
    delay += 1;

    tl.to(plane.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: 'power4.inOut' }, delay);
    tl.to(plane.position, { z: 30, ease: 'power4.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: 'power4.inOut' }, delay);
    tl.to(plane.position, { z: 60, x: 30, ease: 'power4.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.35, y: tau * 0.75, z: tau * 0.6, ease: 'power4.inOut' }, delay);
    tl.to(plane.position, { z: 100, x: 20, y: 0, ease: 'power4.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { x: tau * 0.15, y: tau * 0.85, z: -tau * 0, ease: 'power1.in' }, delay);
    tl.to(plane.position, { z: -150, x: 0, y: 0, ease: 'power1.inOut' }, delay);

    delay += 1;
    tl.to(plane.rotation, { duration: 1, x: -tau * 0.05, y: tau, z: -tau * 0.1, ease: 'none' }, delay);
    tl.to(plane.position, { duration: 1, x: 0, y: 30, z: 320, ease: 'power1.in' }, delay);

    tl.to(scene.light.position, { duration: 1, x: 0, y: 0, z: 0 }, delay);

    setIsLoading(false);
  };

  useEffect(() => {
    if (isMounted) {
      loadModel();
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="h-screen bg-[#D0CBC7] flex items-center justify-center">
        <div className="text-2xl font-serif">Cargando...</div>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="content relative font-serif bg-[#D0CBC7] text-black overflow-x-hidden min-h-[100vh]">
      {/* Loading */}
      {isLoading && (
        <div className="loading fixed w-full h-full top-0 left-0 flex items-center justify-center text-[3vw] lg:text-[24px] z-50 bg-[#D0CBC7]">
          {heroContent.loading}
        </div>
      )}

      {/* Canvas */}
      <canvas 
        ref={canvasRef}
        className="fixed top-0 left-0 z-[2] pointer-events-none opacity-0"
      />

      {/* Trigger */}
      <div className="trigger absolute top-0 h-full"></div>

      {/* Primera sección */}
      <div className="section relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2]">
        <h1 className="text-[10vw] sm:text-[8vw] lg:text-[64px] font-bold m-0 mb-[1vmin] sm:mb-[2vmin] inline leading-none">
          {heroContent.intro.title}
        </h1>
        <h3 className="text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-normal m-0 mb-[1vmin] text-[#333]">
          {heroContent.intro.subtitle}
        </h3>
        <p className="text-[3vw] sm:text-[2.5vw] lg:text-[18px] mb-[2vmin] text-[#666]">
          {heroContent.intro.description}
        </p>
        <div className="scroll-cta absolute bottom-[5vmin] sm:bottom-[8vmin] lg:bottom-[10vmin] text-[3vw] sm:text-[2.5vw] lg:text-[20px] opacity-0 text-[#FFCC00] font-semibold">
          {heroContent.intro.scroll}
        </div>
      </div>

      {/* Secciones principales */}
      {heroContent.sections.slice(0, 2).map((section, index) => (
        <div key={index} className={`section relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] ${index % 2 === 1 ? 'text-right' : ''}`}>
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {section.main}
          </h2>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px] text-[#666] mt-4">
            {section.sub}
          </p>
        </div>
      ))}

      {/* Ground container con más secciones */}
      <div className="ground-container relative overflow-hidden">
        <div className="parallax ground absolute top-0 left-0 right-0 bottom-[-100px] bg-cover bg-top bg-no-repeat z-[-1]"
             style={{ 
               backgroundImage: "url('https://assets.codepen.io/557388/background-reduced.jpg')",
               transformOrigin: 'top center'
             }}>
        </div>
        
        {heroContent.sections.slice(2, 6).map((section, index) => (
          <div key={index + 2} className={`section relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] ${index % 2 === 1 ? 'text-right' : ''}`}>
            <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
              {section.main}
            </h2>
            <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px] text-[#666] mt-4">
              {section.sub}
            </p>
          </div>
        ))}
        
        <div className="section relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-right">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.sections[6].main}
          </h2>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px] text-[#666] mt-4">
            {heroContent.sections[6].sub}
          </p>
        </div>
        
        <div className="parallax clouds absolute top-0 left-0 right-0 bottom-[-100px] bg-cover bg-top bg-no-repeat z-[2] pointer-events-none"
             style={{ 
               backgroundImage: "url('https://assets.codepen.io/557388/clouds.png')",
               transformOrigin: 'top center'
             }}>
        </div>
      </div>

      {/* Blueprint section */}
      <div className="blueprint relative bg-[#131C2A]" 
           style={{
             backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
             backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
             backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',
             backgroundAttachment: 'fixed'
           }}>
        
        <svg className="fixed top-0 left-0 w-full h-full stroke-white pointer-events-none z-[100]" 
             width="100%" height="100%" viewBox="0 0 100 100"
             style={{ visibility: 'hidden' }}>
          <line id="line-length" x1="10" y1="80" x2="90" y2="80" strokeWidth="0.5"></line>
          <path id="line-wingspan" d="M10 50, L40 35, M60 35 L90 50" strokeWidth="0.5"></path>
          <circle id="circle-phalange" cx="60" cy="60" r="15" fill="transparent" strokeWidth="0.5"></circle>
        </svg>

        <div className="section dark relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.blueprint.intro.title}
          </h2>
          <h3 className="text-[#FFCC00] text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-bold mb-[1vmin]">
            {heroContent.blueprint.intro.subtitle}
          </h3>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px]">
            {heroContent.blueprint.intro.description}
          </p>
        </div>

        <div className="section dark length relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.blueprint.sections[0].title}
          </h2>
          <h3 className="text-[#FFCC00] text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-bold mb-[1vmin]">
            {heroContent.blueprint.sections[0].subtitle}
          </h3>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px]">
            {heroContent.blueprint.sections[0].description}
          </p>
        </div>

        <div className="section dark wingspan relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.blueprint.sections[1].title}
          </h2>
          <h3 className="text-[#FFCC00] text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-bold mb-[1vmin]">
            {heroContent.blueprint.sections[1].subtitle}
          </h3>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px]">
            {heroContent.blueprint.sections[1].description}
          </p>
        </div>

        <div className="section dark phalange relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.blueprint.sections[2].title}
          </h2>
          <h3 className="text-[#FFCC00] text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-bold mb-[1vmin]">
            {heroContent.blueprint.sections[2].subtitle}
          </h3>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px]">
            {heroContent.blueprint.sections[2].description}
          </p>
        </div>

        <div className="section dark relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[2vmin] inline leading-tight">
            {heroContent.blueprint.sections[3].title}
          </h2>
          <h3 className="text-[#FFCC00] text-[4vw] sm:text-[3.5vw] lg:text-[28px] font-bold mb-[1vmin]">
            {heroContent.blueprint.sections[3].subtitle}
          </h3>
          <p className="text-[2.5vw] sm:text-[2vw] lg:text-[16px]">
            {heroContent.blueprint.sections[3].description}
          </p>
        </div>
      </div>

      {/* Sunset - Sección final sin avión */}
      <div className="sunset bg-cover bg-top bg-no-repeat"
           style={{ 
             backgroundImage: "url('https://assets.codepen.io/557388/sunset-reduced.jpg')",
             transformOrigin: 'top center'
           }}>
        <div className="section relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2]"></div>
        <div className="section end relative p-[5vmin] sm:p-[8vmin] lg:p-[10vmin] w-[calc(100vw-10vmin)] sm:w-[calc(100vw-16vmin)] lg:w-[calc(100vw-20vmin)] h-[calc(100vh-10vmin)] sm:h-[calc(100vh-16vmin)] lg:h-[calc(100vh-20vmin)] m-auto z-[2]">
          <h2 className="text-[7vw] sm:text-[6vw] lg:text-[48px] font-bold m-0 mb-[5vh] sm:mb-[10vh] lg:mb-[20vh] inline leading-tight">
            {heroContent.end.title}
          </h2>
          <h3 className="text-[#FFCC00] text-[5vw] sm:text-[4vw] lg:text-[32px] font-black mb-[10vh] sm:mb-[20vh] lg:mb-[30vh] block">
            {heroContent.end.subtitle}
          </h3>
        </div>
      </div>
    </div>
  );
}
