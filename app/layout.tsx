// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Nova Rotina',
  description: 'Sistema de horários baseado na sua planilha',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
