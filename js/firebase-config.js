// Firebase Configuration
// Project: monitoring-92e1e
// PENTING: Jangan commit file ini ke repository publik.
// Gunakan Firebase Security Rules untuk membatasi akses data.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
