// ========================================
// app/page.js
// Página inicial — site institucional público
// ========================================

"use client";

import Link from "next/link";

export default function FHomePage() {
  return (
    <>
      {/* HEADER / NAVBAR */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(212, 160, 23, 0.2)",
        }}
      >
        <nav className="container" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "70px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--egbe-yellow)",
            }}>
              Ẹgbẹ́ Fátọ́ún
            </span>
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            {["Início", "Sobre", "Eventos", "Cursos", "Contato"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={{
                  color: "var(--egbe-cream)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  transition: "color 0.2s",
                }}
              >
                {item}
              </a>
            ))}
            <Link href="/login" className="btn btn-gold" style={{ padding: "0.5rem 1.25rem" }}>
              Entrar
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="início"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(160deg, var(--egbe-black) 0%, var(--egbe-green-dark) 100%)",
          color: "white",
          paddingTop: "70px",
        }}
      >
        <div className="container" style={{ textAlign: "center", maxWidth: "800px" }}>
          {/* Faixa de cores rituais */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "4px",
            marginBottom: "2rem",
          }}>
            {["#FAF9F6", "#1B6B3A", "#D4A017", "#B22222"].map((color) => (
              <div key={color} style={{
                width: "40px",
                height: "4px",
                borderRadius: "2px",
                background: color,
              }} />
            ))}
          </div>

          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--egbe-yellow)",
            marginBottom: "1rem",
          }}>
            Templo Religioso de Ìfá e Òrìṣà
          </p>

          <h1 style={{ color: "white", marginBottom: "1.5rem" }}>
            Ẹgbẹ́ Fátọ́ún
          </h1>

          <p style={{
            fontSize: "1.15rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.8)",
            marginBottom: "2.5rem",
            maxWidth: "600px",
            margin: "0 auto 2.5rem",
          }}>
            Sob a liderança da Ìyánífá Fátọ́ún, preservamos e transmitimos
            os ensinamentos sagrados da tradição de Ìfá e Òrìṣà.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <a href="#eventos" className="btn btn-gold">
              Próximos Eventos
            </a>
            <Link
              href="/login"
              className="btn"
              style={{
                background: "transparent",
                color: "white",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              Área do Membro
            </Link>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" style={{ padding: "var(--section-padding)", background: "var(--egbe-cream)" }}>
        <div className="container" style={{ maxWidth: "900px", textAlign: "center" }}>
          <p style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--egbe-green)",
            marginBottom: "0.75rem",
          }}>
            Nossa Casa
          </p>
          <h2 style={{ marginBottom: "1.5rem" }}>Tradição e Conhecimento</h2>
          <p style={{
            fontSize: "1.05rem",
            color: "#555",
            lineHeight: 1.8,
            maxWidth: "700px",
            margin: "0 auto",
          }}>
            O Ẹgbẹ́ Fátọ́ún é um espaço dedicado ao estudo, prática e preservação
            da tradição de Ìfá. Aqui, cada filho da casa encontra acolhimento,
            orientação espiritual e a oportunidade de aprofundar seu conhecimento
            sobre os Òrìṣà e os ensinamentos do corpus de Ifá.
          </p>
        </div>
      </section>

      {/* EVENTOS (placeholder da Fase 2) */}
      <section id="eventos" style={{ padding: "var(--section-padding)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--egbe-green)",
            marginBottom: "0.75rem",
          }}>
            Festivais e Encontros
          </p>
          <h2 style={{ marginBottom: "2rem" }}>Próximos Eventos</h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            maxWidth: "900px",
            margin: "0 auto",
          }}>
            {[
              { name: "Odún Ọ̀ṣun", date: "Em breve", color: "var(--egbe-yellow)" },
              { name: "Odún Ọbàtálá", date: "Em breve", color: "var(--egbe-white)" },
              { name: "Odún Ògún", date: "Em breve", color: "var(--egbe-green)" },
            ].map((evt) => (
              <div key={evt.name} className="card" style={{ textAlign: "left" }}>
                <div style={{
                  width: "100%",
                  height: "4px",
                  background: evt.color,
                  borderRadius: "2px",
                  marginBottom: "1rem",
                  border: evt.color === "var(--egbe-white)" ? "1px solid #ddd" : "none",
                }} />
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{evt.name}</h3>
                <p style={{ color: "#888", fontSize: "0.9rem" }}>{evt.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: "var(--egbe-black)",
        color: "rgba(255,255,255,0.6)",
        padding: "3rem 1.5rem",
        textAlign: "center",
        fontSize: "0.85rem",
      }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--egbe-yellow)", marginBottom: "0.5rem" }}>
          Ẹgbẹ́ Fátọ́ún
        </p>
        <p>Templo Religioso de Ìfá e Òrìṣà — Ìyánífá Fátọ́ún</p>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem" }}>
          © {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </footer>
    </>
  );
}
