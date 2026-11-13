import CatwalkLookbook from '@/components/catwalk-lookbook';

export const metadata = {
  title: 'Looks · BIG K',
  description: 'Wear the whole look. Shoppable runway outfits from BIG K.',
  robots: {index: true, follow: true},
};

export default function LooksPage() {
  return (
    <main id="main">
      <CatwalkLookbook />
    </main>
  );
}
