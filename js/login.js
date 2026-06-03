// ============================================
// AUTHENTICATION - LOGIN & LOGOUT
// ============================================

import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============ DOM ELEMENTS ============
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const messageEl = document.getElementById('loginMessage');
const rememberCheckbox = document.getElementById('rememberMe');

// ============ HELPER FUNCTIONS ============
function showMessage(message, type = 'error') {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    
    setTimeout(() => {
        if (messageEl.textContent === message) {
            messageEl.textContent = '';
            messageEl.className = 'form-message';
        }
    }, 5000);
}

function setLoading(isLoading) {
    if (!loginBtn) return;
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.querySelector('span').textContent = 'Memproses...';
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.querySelector('span').textContent = 'Masuk';
    }
}

// ============ LOGIN HANDLER ============
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        
        // Validasi input
        if (!email || !password) {
            showMessage('Email dan password harus diisi', 'error');
            return;
        }
        
        if (!email.includes('@')) {
            showMessage('Masukkan email yang valid', 'error');
            return;
        }
        
        setLoading(true);
        showMessage('Memeriksa akun...', 'loading');
        
        try {
            // Set persistence (ingat saya atau tidak)
            const persistence = rememberCheckbox?.checked 
                ? browserLocalPersistence 
                : browserSessionPersistence;
            await setPersistence(auth, persistence);
            
            // Login ke Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login berhasil:', userCredential.user.email);
            
            showMessage('Berhasil masuk! Mengalihkan...', 'success');
            
            // Redirect ke dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            
            // Handle error Firebase
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    showMessage('Email atau password salah', 'error');
                    break;
                case 'auth/too-many-requests':
                    showMessage('Terlalu banyak percobaan. Coba lagi nanti', 'error');
                    break;
                case 'auth/invalid-email':
                    showMessage('Format email tidak valid', 'error');
                    break;
                case 'auth/user-disabled':
                    showMessage('Akun Anda telah dinonaktifkan', 'error');
                    break;
                default:
                    showMessage('Terjadi kesalahan: ' + error.message, 'error');
            }
            
            // Clear password
            if (passwordInput) passwordInput.value = '';
            passwordInput?.focus();
        } finally {
            setLoading(false);
        }
    });
}

// ============ AUTO REDIRECT IF ALREADY LOGGED IN ============
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user?.email || 'Tidak ada user');
    
    if (user && window.location.pathname.includes('login.html')) {
        console.log('User sudah login, redirect ke dashboard');
        window.location.href = 'dashboard.html';
    }
});

// ============ LOGOUT FUNCTION ============
export async function logout() {
    try {
        await signOut(auth);
        console.log('✅ Logout berhasil');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
}

// ============ TOGGLE PASSWORD VISIBILITY ============
const toggleBtn = document.getElementById('togglePasswordBtn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const passInput = document.getElementById('password');
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    });
}

// ============ LOAD SAVED EMAIL ============
const savedEmail = localStorage.getItem('savedEmail');
if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
}