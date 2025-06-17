'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// ==========================================
// 🎯 CONFIGURACIÓN - EDITA AQUÍ TUS TEXTOS
// ==========================================

const heroContent = {
  loading: "Loading",
  intro: {
    title: "Muscle Up GYM.",
    subtitle: "Tu guía hacia la transformación.",
    description: "Probablemente has olvidado lo que es sentirte fuerte.",
    scroll: "Scroll"
  },
  sections: [
    "Son como gimnasios normales...",
    "...excepto que te transforman completamente.",
    "Te hacen volar hacia tus metas.",
    "Desafiando todos los límites conocidos."
  ],
  blueprint: {
    intro: "Los hechos y las cifras.",
    description: "Vamos a los detalles...",
    sections: [
      { title: "Fuerza.", description: "Intensa." },
      { title: "Resistencia.", description: "Sin límites, más fuerte que un león." },
      { title: "Músculo Izquierdo", description: "Creciendo" },
      { title: "Cardio", description: "Diversión cardiovascular" }
    ]
  },
  end: {
    title: "Fin.",
    credits: [
      'Modelo de avión por <a href="https://poly.google.com/view/8ciDd9k8wha" target="_blank">Google</a>',
      'Animado usando <a href="https://greensock.com/scrolltrigger/" target="_blank">GSAP ScrollTrigger</a>'
    ]
  }
};

// ==========================================
// 🎨 SCENE CLASS (CORREGIDA)
// ==========================================

class Scene {
  views: Array<{ bottom: number; height: number; camera?: THREE.PerspectiveCamera }>;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  light: THREE.PointLight;
  softLight: THREE.AmbientLight;
  modelGroup: THREE.Group;
  w: number = 0; // ✅ CORREGIDO: Inicializado
  h: number = 0; // ✅ CORREGIDO: Inicializado

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

    // Scene
    this.scene = new THREE.Scene();

    // Cameras
    for (let ii = 0; ii < this.views.length; ++ii) {
      const view = this.views[ii];
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.fromArray([0, 0, 180]);
      camera.layers.disableAll();
      camera.layers.enable(ii);
      view.camera = camera;
      camera.lookAt(new THREE.Vector3(0, 5, 0));
    }

    // Light
    this.light = new THREE.PointLight(0xffffff, 0.75);
    this.light.position.z = 150;
    this.light.position.x = 70;
    this.light.position.y = -20;
    this.scene.add(this.light);

    this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(this.softLight);

    // Model setup
    this.onResize();
    window.addEventListener('resize', this.onResize, false);

    // ✅ CORREGIDO: Check if model has geometry before accessing
    let edges: THREE.EdgesGeometry | undefined;
    if (model.children.length > 0) {
      const firstChild = model.children[0] as THREE.Mesh;
      if (firstChild && firstChild.geometry) {
        edges = new THREE.EdgesGeometry(firstChild.geometry);
      }
    }

    this.modelGroup = new THREE.Group();

    model.layers.set(0);
    
    // Only add wireframe if we have edges
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ==========================================
  // ✈️ LOAD MODEL FUNCTION
  // ==========================================

  const loadModel = async () => {
    if (typeof window === 'undefined') return;

    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');

    gsap.registerPlugin(ScrollTrigger);
    
    // ✅ CORREGIDO: Solo usar DrawSVG si está disponible
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
    manager.onProgress = (item, loaded, total) => console.log(item, loaded, total);

    const loader = new OBJLoader(manager);
    
    // Load the airplane model
    loader.load('https://assets.codepen.io/557388/1405+Plane_1.obj', (obj) => {
      object = obj;
    });
  };

  // ==========================================
  // 🎬 SETUP ANIMATION
  // ==========================================

  const setupAnimation = async (model: THREE.Group) => {
    if (!canvasRef.current) return;

    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');

    const scene = new Scene(model, canvasRef.current);
    const plane = scene.modelGroup;

    // ✅ CORREGIDO: Canvas empieza invisible y aparece cuando debe
    gsap.fromTo(canvasRef.current, 
      { x: "50%", autoAlpha: 0 }, 
      { duration: 1, x: "0%", autoAlpha: 1 }
    );
    
    gsap.to('.loading', { autoAlpha: 0 });
    gsap.to('.scroll-cta', { opacity: 1 });
    gsap.set('svg', { autoAlpha: 1 });

    const tau = Math.PI * 2;

    // ✅ CORREGIDO: Posición inicial MUY fuera de vista
    gsap.set(plane.rotation, { y: tau * -0.25 });
    gsap.set(plane.position, { x: 80, y: -32, z: -60 });

    scene.render();

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

    // SVG drawing animations (solo si DrawSVG está disponible)
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

      // SVG fade out animations
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

    // ✅ CORREGIDO: Main timeline con delay inicial para que aparezca en su sección
    const tl = gsap.timeline({
      onUpdate: scene.render,
      scrollTrigger: {
        trigger: ".content",
        scrub: true,
        start: "top top",
        end: "bottom bottom"
      },
      defaults: { duration: 1, ease: 'power2.inOut' }
    });

    let delay = 0;

    // ✅ AQUÍ ES DONDE EMPIEZA A APARECER EL AVIÓN
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
    <div className="content relative font-serif bg-[#D0CBC7] text-black overflow-x-hidden min-h-[100vh]">
      {/* Loading */}
      {isLoading && (
        <div className="loading fixed w-full h-full top-0 left-0 flex items-center justify-center text-[4vw] lg:text-[32px] z-50 bg-[#D0CBC7]">
          {heroContent.loading}
        </div>
      )}

      {/* ✅ CORREGIDO: Canvas invisible inicialmente */}
      <canvas 
        ref={canvasRef}
        className="fixed top-0 left-0 z-[2] pointer-events-none"
        style={{ visibility: 'hidden', opacity: 0 }}
      />

      {/* Trigger */}
      <div className="trigger absolute top-0 h-full"></div>

      {/* Primera sección */}
      <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2]">
        <h1 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
          {heroContent.intro.title}
        </h1>
        <h3 className="text-[4vw] lg:text-[32px] font-normal m-0 mb-[1vmin]">
          {heroContent.intro.subtitle}
        </h3>
        <p className="text-[2vw] lg:text-[16px] mb-[2vmin]">
          {heroContent.intro.description}
        </p>
        <div className="scroll-cta absolute bottom-[10vmin] text-[4vw] lg:text-[32px] opacity-0">
          {heroContent.intro.scroll}
        </div>
      </div>

      {/* Secciones intermedias */}
      <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-right">
        <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
          {heroContent.sections[0]}
        </h2>
      </div>

      {/* Ground container */}
      <div className="ground-container relative overflow-hidden">
        <div className="parallax ground absolute top-0 left-0 right-0 bottom-[-100px] bg-cover bg-top bg-no-repeat z-[-1]"
             style={{ 
               backgroundImage: "url('https://assets.codepen.io/557388/background-reduced.jpg')",
               transformOrigin: 'top center'
             }}>
        </div>
        
        <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-right">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.sections[1]}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">¡En serio!</p>
        </div>

        <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2]">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.sections[2]}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">¡De verdad!</p>
        </div>
        
        <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-right">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.sections[3]}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">¡Es pura magia!</p>
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

        <div className="section dark relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.blueprint.intro}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">{heroContent.blueprint.description}</p>
        </div>

        <div className="section dark length relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.blueprint.sections[0].title}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">{heroContent.blueprint.sections[0].description}</p>
        </div>

        <div className="section dark wingspan relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.blueprint.sections[1].title}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">{heroContent.blueprint.sections[1].description}</p>
        </div>

        <div className="section dark phalange relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.blueprint.sections[2].title}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">{heroContent.blueprint.sections[2].description}</p>
        </div>

        <div className="section dark relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2] text-white bg-transparent">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[2vmin] inline leading-none">
            {heroContent.blueprint.sections[3].title}
          </h2>
          <p className="text-[2vw] lg:text-[16px]">{heroContent.blueprint.sections[3].description}</p>
        </div>
      </div>

      {/* Sunset */}
      <div className="sunset bg-cover bg-top bg-no-repeat"
           style={{ 
             backgroundImage: "url('https://assets.codepen.io/557388/sunset-reduced.jpg')",
             transformOrigin: 'top center'
           }}>
        <div className="section relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2]"></div>
        <div className="section end relative p-[10vmin] w-[calc(100vw-20vmin)] h-[calc(100vh-20vmin)] m-auto z-[2]">
          <h2 className="text-[8vw] lg:text-[64px] font-bold m-0 mb-[50vh] inline leading-none">
            {heroContent.end.title}
          </h2>
          <ul className="credits absolute bottom-[10vmin] m-0 p-0 list-none text-white">
            {heroContent.end.credits.map((credit, index) => (
              <li key={index} className="mt-[10px]" dangerouslySetInnerHTML={{ __html: credit }} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}