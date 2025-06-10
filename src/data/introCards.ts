export type IntroCard = {
    id: string;
    title: string;
    text: string;
    img: string;
    align?: 'left' | 'right' | 'center';
    /** 0–1  → cuánto se desplaza el parallax (0.25 = 25 %) */
    parallax?: number;
    /** valor final del contador; si no hay contador omite la prop */
    counter?: {
      value: number;
      prefix?: string;
      suffix?: string;
      title?: string;
    };
  };
  
  export const introCards: IntroCard[] = [
    {
      id: 'mision',
      title: 'Nuestra Misión',
      text: 'Transformar vidas a través del fitness, brindando un espacio motivador donde cada persona pueda alcanzar su mejor versión.',
      img: '/img/mision.jpg',
      align: 'left',
      parallax: 0.25,
    },
    {
      id: 'vision',
      title: 'Nuestra Visión',
      text: 'Ser reconocidos como el gimnasio líder en transformación física y mental, creando una comunidad vibrante de personas saludables y felices.',
      img: '/img/vision.jpg',
      align: 'right',
      parallax: 0.25,
    },
    {
      id: 'valores',
      title: 'Nuestros Valores',
      text: 'Compromiso, disciplina y pasión guían cada entrenamiento y servicio que ofrecemos.',
      img: '/img/valores.jpg',
      align: 'center',
      parallax: 0.25,
      counter: {
        value: 200,
        prefix: '+',
        title: 'Miembros satisfechos',
      },
    },
  ];
  