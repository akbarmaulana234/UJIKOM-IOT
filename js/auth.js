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
    apiKey: "AIzaSyDEFAULT_PLACEHOLDER_REPLACE_ME",     // GANTI DENGAN API KEY KAMU
    authDomain: "ujikom-2026.firebaseapp.com",          // GANTI
    databaseURL: "https://ujikom-2026-default-rtdb.asia-southeast1.firebasedatabase.app", // GANTI
    projectId: "ujikom-2026",                           // GANTI
    storageBucket: "ujikom-2026.firebasestorage.app",   // GANTI
    messagingSenderId: "123456789012",                  // GANTI
    appId: "1:123456789012:web:abcdef123456"            // GANTI
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export untuk digunakan di file lain
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log("✅ Firebase berhasil diinisialisasi");