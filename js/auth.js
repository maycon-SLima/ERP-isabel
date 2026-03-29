// Firebase Auth integração
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlH77gs7jvd9MPyuze32LZTDfHbqy9FIk",
  authDomain: "ung-frameworks.firebaseapp.com",
  projectId: "ung-frameworks",
  storageBucket: "ung-frameworks.firebasestorage.app",
  messagingSenderId: "88240724756",
  appId: "1:88240724756:web:890779401a93a01187c001",
  measurementId: "G-9Z9YJKM2PS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function signup(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}