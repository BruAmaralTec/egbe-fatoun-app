// ========================================
// lib/LOdu.js
// Dados dos 16 Odú Méjì de Ifá e helpers
// Convenção: I = 1 traço, II = 2 traços
// ========================================

export const MEIJI_ODUS = [
  { id: "ogbe", name: "Ogbè Méjì", marks: ["I", "I", "I", "I"], significance: "Luz, pureza, começo, clareza" },
  { id: "oyeku", name: "Ọ̀yẹ̀kú Méjì", marks: ["II", "II", "II", "II"], significance: "Ancestralidade, sombra, transformação" },
  { id: "iwori", name: "Ìwòrì Méjì", marks: ["II", "I", "I", "II"], significance: "Visão, transformação profunda, reflexão" },
  { id: "odi", name: "Òdí Méjì", marks: ["I", "II", "II", "I"], significance: "Ventre, proteção, estabilidade" },
  { id: "irosun", name: "Ìrosùn Méjì", marks: ["I", "I", "II", "II"], significance: "Sangue, vida, ancestralidade feminina" },
  { id: "owonrin", name: "Ọ̀wọ́nrín Méjì", marks: ["II", "II", "I", "I"], significance: "Força, coragem, ação" },
  { id: "obara", name: "Ọ̀bàrà Méjì", marks: ["I", "II", "II", "II"], significance: "Reis, prosperidade, palavra" },
  { id: "okanran", name: "Ọ̀kànràn Méjì", marks: ["II", "II", "II", "I"], significance: "Raios, transformação súbita" },
  { id: "ogunda", name: "Ògúndá Méjì", marks: ["I", "I", "I", "II"], significance: "Ferro, caminho aberto, Ògún" },
  { id: "osa", name: "Ọ̀sá Méjì", marks: ["II", "I", "I", "I"], significance: "Ventos, mudança, Ọya" },
  { id: "ika", name: "Ìká Méjì", marks: ["II", "I", "II", "II"], significance: "Vigilância, feitiço, proteção mágica" },
  { id: "oturupon", name: "Òtúrúpọ̀n Méjì", marks: ["II", "II", "I", "II"], significance: "Cura, equilíbrio, doença" },
  { id: "otura", name: "Òtúá Méjì", marks: ["I", "II", "I", "I"], significance: "Viagem, comércio, Ifá, Ọ̀rúnmìlà" },
  { id: "irete", name: "Ìrẹ̀tẹ̀ Méjì", marks: ["I", "I", "II", "I"], significance: "Sorte, vitória, recomeço" },
  { id: "ose", name: "Ọ̀ṣẹ́ Méjì", marks: ["I", "II", "I", "II"], significance: "Prosperidade, Ọ̀ṣun, dinheiro" },
  { id: "ofun", name: "Òfún Méjì", marks: ["II", "I", "II", "I"], significance: "Criação, Ọbàtálá, branco" },
];

const MARKS_KEY = (marks) => marks.join(",");
const BY_MARKS = Object.fromEntries(MEIJI_ODUS.map((o) => [MARKS_KEY(o.marks), o]));

/**
 * Dado um lado de 4 marcas ["I"|"II", ...], devolve o odú base correspondente
 * ou null se inválido.
 */
export function decodeSide(marks) {
  if (!marks || marks.length !== 4) return null;
  return BY_MARKS[MARKS_KEY(marks)] || null;
}

/**
 * Compõe o odú completo (dois lados). Se ambos iguais → é méjì.
 * Retorna { name, significance, left, right }.
 */
export function composeOdu(leftMarks, rightMarks) {
  const L = decodeSide(leftMarks);
  const R = decodeSide(rightMarks);
  if (!L || !R) return null;
  if (L.id === R.id) return { name: L.name, significance: L.significance, left: L, right: R };
  const shortL = L.name.replace(" Méjì", "");
  const shortR = R.name.replace(" Méjì", "");
  // Convenção Ifá: lê-se direita → esquerda (lado direito vem primeiro no nome)
  return {
    name: `${shortR} ${shortL}`,
    significance: `Composto de ${shortR} + ${shortL}. O sacerdote deve interpretar conforme contexto.`,
    left: L,
    right: R,
  };
}
