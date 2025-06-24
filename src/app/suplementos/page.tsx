'use client';
import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SuplementosPage() {
  const [logos, setLogos] = useState([]);
  const controls = useAnimationControls();
  const [isHovered, setIsHovered] = useState(false);

  // Lista de logos - actualiza con tus archivos reales
  useEffect(() => {
    const logoFiles = [
      'muscletech-logo-3DBC4BBC88-seeklogo.com_.png', 'descarga.jpg', 'descarga-1.png', 'bpinew.webp'
    ];
    setLogos(logoFiles);
    
    // Iniciar animación del carrusel solo en el cliente
    if (typeof window !== 'undefined') {
      controls.start({
        x: [0, -100 * logoFiles.length * 10],
        transition: {
          duration: 30,
          ease: "linear",
          repeat: Infinity,
        }
      });
    }
  }, [controls]);

  // Controlar pausa del carrusel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isHovered) {
      controls.stop();
    } else {
      controls.start({
        x: [0, -100 * logos.length * 10],
        transition: {
          duration: 30,
          ease: "linear",
          repeat: Infinity,
        }
      });
    }
  }, [isHovered, controls, logos.length]);

  const suplementosInfo = [
    {
      title: "Proteína",
      icon: "💪",
      description: "Esencial para la síntesis de proteína muscular",
      benefits: [
        "Acelera la recuperación muscular post-entrenamiento",
        "Estimula la síntesis de proteína muscular (MPS)",
        "Ayuda a mantener la masa muscular en déficit calórico",
        "Mejora la saciedad y control del apetito"
      ],
      science: "Estudios demuestran que consumir 20-40g de proteína post-ejercicio optimiza la síntesis proteica muscular durante las siguientes 3-4 horas.",
      gradientFrom: "#3B82F6",
      gradientTo: "#1E40AF"
    },
    {
      title: "Creatina",
      icon: "⚡",
      description: "El suplemento más estudiado para rendimiento deportivo",
      benefits: [
        "Aumenta la fuerza y potencia muscular hasta un 15%",
        "Mejora el rendimiento en ejercicios de alta intensidad",
        "Acelera la regeneración de ATP",
        "Puede incrementar la masa muscular magra"
      ],
      science: "Más de 1000 estudios respaldan la eficacia de 3-5g diarios de monohidrato de creatina para mejorar el rendimiento deportivo.",
      gradientFrom: "#10B981",
      gradientTo: "#059669"
    },
    {
      title: "Quemadores de Grasa",
      icon: "🔥",
      description: "Potenciadores del metabolismo y la termogénesis",
      benefits: [
        "Incrementan la termogénesis hasta un 5-10%",
        "Mejoran la oxidación de grasas durante el ejercicio",
        "Pueden suprimir el apetito naturalmente",
        "Aumentan los niveles de energía y concentración"
      ],
      science: "Ingredientes como la cafeína, té verde y L-carnitina han demostrado científicamente incrementar el gasto energético y la movilización de grasas.",
      gradientFrom: "#EF4444",
      gradientTo: "#DC2626"
    },
    {
      title: "BCAA / EAA",
      icon: "🧬",
      description: "Aminoácidos esenciales para la construcción muscular",
      benefits: [
        "Previenen el catabolismo muscular durante el entrenamiento",
        "Reducen la fatiga y mejoran la resistencia",
        "Aceleran la síntesis de proteína muscular",
        "Disminuyen el dolor muscular post-ejercicio"
      ],
      science: "Los aminoácidos de cadena ramificada, especialmente la leucina, activan la vía mTOR, clave para la síntesis proteica.",
      gradientFrom: "#8B5CF6",
      gradientTo: "#7C3AED"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '1.5rem'
      }}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}
      >
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}
        >
          Suplementos
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontSize: '1.25rem',
            color: '#6B7280',
            maxWidth: '48rem',
            margin: '0 auto'
          }}
        >
          Las mejores marcas y productos para optimizar tus resultados
        </motion.p>
      </motion.div>

      {/* Carrusel de logos */}
      <motion.div
        variants={itemVariants}
        style={{
          marginBottom: '4rem',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <motion.h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#1F2937'
          }}
        >
          Marcas de Confianza
        </motion.h2>
        
        <div
          style={{
            position: 'relative',
            height: '6rem',
            overflow: 'hidden'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Gradientes de desvanecimiento */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '6rem',
              height: '100%',
              background: 'linear-gradient(to right, white, transparent)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '6rem',
              height: '100%',
              background: 'linear-gradient(to left, white, transparent)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
          
          <motion.div
            animate={controls}
            style={{
              display: 'flex',
              gap: '2rem',
              width: 'max-content'
            }}
          >
            {/* Primera serie */}
            {logos.map((logo, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  flexShrink: 0,
                  width: '8rem',
                  height: '5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={`/logos/${logo}`}
                  alt={`Marca ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: isHovered ? 'grayscale(0)' : 'grayscale(1)',
                    transition: 'filter 0.3s ease'
                  }}
                />
              </motion.div>
            ))}
            
            {/* Segunda serie para loop infinito */}
            {logos.map((logo, index) => (
              <motion.div
                key={`duplicate-${index}`}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  flexShrink: 0,
                  width: '8rem',
                  height: '5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={`/logos/${logo}`}
                  alt={`Marca ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: isHovered ? 'grayscale(0)' : 'grayscale(1)',
                    transition: 'filter 0.3s ease'
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Sección educativa */}
      <motion.div
        variants={itemVariants}
        style={{ marginBottom: '4rem' }}
      >
        <motion.div
          style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}
        >
          <motion.h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1F2937',
              marginBottom: '1rem'
            }}
          >
            Ciencia y Beneficios
          </motion.h2>
          <motion.p
            style={{
              fontSize: '1.125rem',
              color: '#6B7280',
              maxWidth: '48rem',
              margin: '0 auto'
            }}
          >
            Información respaldada por estudios científicos sobre los suplementos más efectivos
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
            gap: '2rem'
          }}
        >
          {suplementosInfo.map((suplemento, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.03,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '2rem',
                border: '1px solid #F3F4F6',
                cursor: 'pointer'
              }}
            >
              <motion.div
                style={{ marginBottom: '1.5rem' }}
              >
                <motion.div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    style={{ fontSize: '2rem' }}
                  >
                    {suplemento.icon}
                  </motion.span>
                  <motion.h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      background: `linear-gradient(135deg, ${suplemento.gradientFrom}, ${suplemento.gradientTo})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {suplemento.title}
                  </motion.h3>
                </motion.div>
                <motion.p
                  style={{
                    color: '#6B7280',
                    fontWeight: '500'
                  }}
                >
                  {suplemento.description}
                </motion.p>
              </motion.div>

              <motion.div
                style={{ marginBottom: '1.5rem' }}
              >
                <motion.h4
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '0.75rem'
                  }}
                >
                  Beneficios Principales:
                </motion.h4>
                <motion.ul style={{ listStyle: 'none', padding: 0 }}>
                  {suplemento.benefits.map((benefit, benefitIndex) => (
                    <motion.li
                      key={benefitIndex}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + benefitIndex * 0.05 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <motion.span
                        style={{
                          color: '#3B82F6',
                          marginRight: '0.5rem',
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}
                      >
                        •
                      </motion.span>
                      <span style={{ color: '#374151' }}>{benefit}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>

              <motion.div
                whileHover={{ backgroundColor: '#F9FAFB' }}
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <motion.h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <motion.span
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginRight: '0.5rem' }}
                  >
                    🔬
                  </motion.span>
                  Respaldo Científico
                </motion.h4>
                <motion.p
                  style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    lineHeight: '1.6'
                  }}
                >
                  {suplemento.science}
                </motion.p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Call to action */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
          borderRadius: '1rem',
          padding: '2rem',
          color: 'white'
        }}
      >
        <motion.h3
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          ¿Listo para optimizar tus resultados?
        </motion.h3>
        <motion.p
          style={{
            fontSize: '1.125rem',
            marginBottom: '1.5rem',
            opacity: 0.9
          }}
        >
          Contáctanos para una asesoría personalizada sobre suplementación
        </motion.p>
        <motion.button
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          whileTap={{ scale: 0.95 }}
          style={{
            backgroundColor: 'white',
            color: '#3B82F6',
            fontWeight: 'bold',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          Solicitar Cotización
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
