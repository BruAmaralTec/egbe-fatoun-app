// ========================================
// components/FHomePage.js
// Página de entrada — redireciona para o login
// ========================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FHomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
