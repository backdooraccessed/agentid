'use client';

import {
  Header,
  Hero,
  Features,
  HowItWorks,
  CodeExample,
  Stats,
  CTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CodeExample />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
