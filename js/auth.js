
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const firebaseConfig = {
  apiKey: "AIzaSyAe7RBDeRGDlMliJxp9R-fevM69Ut03VSY",
  authDomain: "ung-projetos.firebaseapp.com",
  projectId: "ung-projetos",
  storageBucket: "ung-projetos.firebasestorage.app",
  messagingSenderId: "11804262226",
  appId: "1:11804262226:web:c4be34b2f651186550048b",
  measurementId: "G-LBCQQ399YE"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = "Ocorreu um erro inesperado. Por favor, tente novamente.";

    // O Firebase (v9+) usa 'auth/invalid-credential' tanto para senha errada
    // quanto para usuário não encontrado, para evitar enumeração de contas.
    switch (error.code) {
      case 'auth/invalid-credential':
        errorMessage = "E-mail ou senha inválidos. Verifique seus dados e tente novamente.";
        break;
      case 'auth/invalid-email':
        errorMessage = "O formato do e-mail fornecido é inválido.";
        break;
    }
    return { success: false, error: errorMessage };
  }
}

// Função para deslogar do sistema
export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return { success: false, error };
  }
}

export async function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// Função para buscar os dados extras do usuário no Firestore
export async function getUserData(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar dados no Firestore:", error);
    return null;
  }
}

export { db };