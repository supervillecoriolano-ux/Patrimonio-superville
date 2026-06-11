// ============================================================
// firebase-config.js — Configuração do Firebase SUPERVILLE
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGYYSZvRNU3S8V42IMrRY65JciMiNNkgg",
  authDomain: "superville-patrimonio.firebaseapp.com",
  projectId: "superville-patrimonio",
  storageBucket: "superville-patrimonio.firebasestorage.app",
  messagingSenderId: "843390838064",
  appId: "1:843390838064:web:37c75a9df17dc799b3d4f5",
  measurementId: "G-RKL0J7CT0H"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db };
