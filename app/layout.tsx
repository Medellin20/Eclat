import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Éclat — Coaching et bien-être sur rendez-vous',
    template: '%s · Éclat',
  },
  description:
    'Réservez une séance avec un coach en yoga, nutrition, sommeil, préparation physique ou prise de parole. Démonstration Next.js.',
  applicationName: 'Éclat',
};

export const viewport: Viewport = {
  themeColor: '#FBF7FA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="grain min-h-screen">
        <AppProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:shadow-levee"
          >
            Aller au contenu principal
          </a>
          <Header />
          <main id="contenu" className="relative z-10 pt-[72px]">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
