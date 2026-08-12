import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAPEL CONTRACT | Gerador & Configurador Contratual',
  description: 'Sistema determinístico de geração de contratos comerciais e gestão jurídica da KAPEL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
