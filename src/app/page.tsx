import Hero from '@/components/home/Hero';
import Benefits from '@/components/home/Benefits';
import Intro from '@/components/home/Intro';
import Testimonials from '@/components/home/Testimonials';
import Gallery from '@/components/home/Gallery';
import InfoTabs from '@/components/home/InfoTabs';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Testimonials />
      <Gallery />
      <InfoTabs />
    </>
  );
}
