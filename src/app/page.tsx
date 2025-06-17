import Hero from '@/components/home/Hero';
import Heroavion from '@/components/home/Heroavion';
import Benefits from '@/components/home/Benefits';
import Intro from '@/components/home/Intro';
import Testimonials from '@/components/home/Testimonials';
import Gallery from '@/components/home/Gallery';
import InfoTabs from '@/components/home/InfoTabs';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Heroavion />
      <Intro />
      <Testimonials />
      <Gallery />
      <InfoTabs />
    </>
  );
}