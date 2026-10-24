import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lead Intel Hub | Prospecção & Auditoria B2B',
  description: 'Plataforma SaaS de Prospecção, Enriquecimento e Auditoria Técnica de Leads B2B com interface moderna e dark.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#08090d] text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
