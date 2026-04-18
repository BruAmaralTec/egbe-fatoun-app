// ========================================
// lib/AuthContext.js
// Provider de autenticação para toda a app
// ========================================

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./LFirebase";

// Contexto que qualquer componente pode acessar
const AuthContext = createContext({});

// Hook personalizado para usar o contexto
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Provider que envolve toda a aplicação.
 *
 * Perfis disponíveis:
 * - sacerdote: Super Admin (Ìyánífá Fátọ́ún)
 * - tecnico: Super Admin técnico
 * - conselho: Admin (gestão de membros, eventos, cursos, rituais)
 * - midias: Gestão de comunicação, redes sociais, eventos e cursos
 * - filho: Membro da casa (acesso à comunidade)
 * - cliente: Acesso básico (eventos, cursos, perfil)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Dados do Firebase Auth
  const [profile, setProfile] = useState(null);  // Dados do Firestore (perfil, Orúkọ, etc.)
  const [loading, setLoading] = useState(true);

  // Escuta mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Busca o perfil completo no Firestore
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile({ id: profileDoc.id, ...profileDoc.data() });
        } else {
          // Caso: login com Google mas Firebase fundiu com conta de email existente
          // (user já tem doc no Firestore com outro uid/mesmo email). Migra os dados.
          let adopted = null;
          if (firebaseUser.email) {
            try {
              const qs = await getDocs(query(collection(db, "users"), where("email", "==", firebaseUser.email)));
              if (!qs.empty) adopted = { id: qs.docs[0].id, ...qs.docs[0].data() };
            } catch (e) { console.warn("lookup users by email:", e.message); }
          }
          if (adopted) {
            const { id, ...data } = adopted;
            await setDoc(doc(db, "users", firebaseUser.uid), data, { merge: true });
            setProfile({ id: firebaseUser.uid, ...data });
          } else {
            // Primeiro acesso de verdade — cria perfil mínimo como "cliente"
            const newProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              role: "cliente",
              createdAt: new Date(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
            setProfile({ id: firebaseUser.uid, ...newProfile });
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login com email e senha
  async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Login com Google
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Vincula credencial do Google a uma conta já existente (email/senha).
  // Uso: quando signInWithPopup(Google) lança auth/account-exists-with-different-credential,
  // capturar GoogleAuthProvider.credentialFromError(err) e chamar isto com a senha informada.
  async function linkGoogleToEmailPassword({ email, password, googleCredential }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await linkWithCredential(cred.user, googleCredential);
    return cred;
  }

  // Registro de novo usuário
  async function register(email, password, displayName) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // Cria o perfil no Firestore
    await setDoc(doc(db, "users", credential.user.uid), {
      email,
      displayName,
      role: "cliente", // Admins mudam o perfil depois
      cpf: "",
      phone: "",
      oruko: "",       // Nome de iniciação — preenchido pelo admin
      initiacoes: [],  // Histórico de iniciações
      observacoes: "",
      createdAt: new Date(),
    });

    return credential;
  }

  // Logout
  async function logout() {
    setProfile(null);
    return signOut(auth);
  }

  // Helpers de permissão
  const isAdmin = profile?.role === "sacerdote" || profile?.role === "tecnico";
  const isConselho = isAdmin || profile?.role === "conselho";

  // Token para enviar nas requisições à API
  async function getToken() {
    if (!user) return null;
    return user.getIdToken();
  }

  const value = {
    user,
    profile,
    setProfile,
    loading,
    isAdmin,
    isConselho,
    loginWithEmail,
    loginWithGoogle,
    linkGoogleToEmailPassword,
    register,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
