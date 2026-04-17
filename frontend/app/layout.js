// ========================================
// app/layout.js
// Layout raiz — envolve toda a aplicação
// ========================================

import "./globals.css";
import { AuthProvider } from "@/lib/LAuthContext";
import { ModalProvider } from "@/lib/LModalContext";

export const metadata = {
  title: "Ẹgbẹ́ Fátọ́ún — Templo Religioso de Ìfá e Òrìṣà",
  description:
    "Ẹgbẹ́ Fátọ́ún é um templo dedicado à tradição de Ìfá e Òrìṣà, sob a liderança da Ìyánífá Fátọ́ún.",
  manifest: "/manifest.json",
  themeColor: "#1B6B3A",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ẹgbẹ́ Fátọ́ún" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Fontes: display + body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ModalProvider><AuthProvider>{children}</AuthProvider></ModalProvider>
      </body>
    </html>
  );
}
