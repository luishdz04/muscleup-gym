// src/components/home/Benefits.tsx
const items = [
    { icon: '⏰', title: '24/7', desc: 'Abierto todo el día' },
    { icon: '💪', title: 'Equipo Pro', desc: 'Máquinas de última generación' },
    { icon: '📊', title: 'App Dashboard', desc: 'Controla tu progreso' },
    { icon: '🏋️', title: 'Coaches Certificados', desc: 'Acompañamiento experto' },
  ];
  
  export default function Benefits() {
    return (
      <section className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 px-6">
          {items.map(({ icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-xl font-bold text-brand mb-2">{title}</h3>
              <p className="text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  