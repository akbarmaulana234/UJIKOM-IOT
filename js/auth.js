// ============================================
// FIREBASE CONFIGURATION
// GANTI DENGAN DATA PROJECT FIREBASE KAMU!
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ============ KONFIGURASI FIREBASE ============
// Ambil dari Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDmtJgn8kXFAxw5FAmQrnaabBoHj5-dcbA",
  authDomain: "ujikom-2026.firebaseapp.com",
  databaseURL: "https://ujikom-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ujikom-2026",
  storageBucket: "ujikom-2026.firebasestorage.app",
  messagingSenderId: "201690433163",
  appId: "1:201690433163:web:90a7f79dad26a83e25f68e",
  measurementId: "G-6F99EGS7EF"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export untuk digunakan di file lain
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log("✅ Firebase berhasil diinisialisasi");