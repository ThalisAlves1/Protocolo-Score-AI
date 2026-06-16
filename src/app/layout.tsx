import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protocolo Score AI",
  description: "Plataforma de simulação clínica para NEWS2, MEOWS e PEWS com feedback por IA."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              <span className="logo-mark" />
              <span>Protocolo Score AI</span>
            </Link>
            <nav className="nav">
              <Link href="/casos">Casos</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">
            Plataforma educacional. Não utilizar para atendimento, diagnóstico ou decisão clínica real.
          </div>
        </footer>
      </body>
    </html>
  );
}
