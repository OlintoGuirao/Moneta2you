// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, addDoc, getDocs, updateDoc, deleteDoc, collection, query, where, onSnapshot, doc } from "firebase/firestore";

// Configuração do Firebase do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyApDYJ4ncCbnC0a-1utq1zxQPQIzOSJz8I",
  authDomain: "moneta2you.firebaseapp.com",
  projectId: "moneta2you",
  storageBucket: "moneta2you.firebasestorage.app",
  messagingSenderId: "888825477332",
  appId: "1:888825477332:web:7ec5385e6f8c6b5e126341",
  measurementId: "G-4XE7SETM08"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, db, addDoc, getDocs, updateDoc, deleteDoc, collection, query, where, onSnapshot, doc }; 