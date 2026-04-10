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
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
 * - conselho: Admin
 * - filho: Acesso configurável por pessoa
 * - cliente: Acesso configurável por pessoa
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
          // Primeiro acesso — cria perfil mínimo como "cliente"
          const newProfile = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "",
            role: "cliente",
            createdAt: new Date(),
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
          setProfile({ id: firebaseUser.uid, ...newProfile });
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
    loading,
    isAdmin,
    isConselho,
    loginWithEmail,
    loginWithGoogle,
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
