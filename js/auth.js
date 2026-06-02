// auth.js - Firebase Authentication dengan UX yang smooth
import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ==================== DOM Elements ====================
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const messageEl = document.getElementById('loginMessage');
const rememberCheckbox = document.getElementById('rememberMe');

// ==================== Helper Functions ====================
function showMessage(message, type = 'error') {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    
    // Auto hide after 5 seconds for non-loading states
    if (type !== 'loading') {
        setTimeout(() => {
            if (messageEl.textContent === message) {
                messageEl.textContent = '';
                messageEl.className = 'form-message';
            }
        }, 5000);
    }
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

// Load saved email from localStorage
function loadSavedEmail() {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

// Save email if remember me checked
function saveEmail(email) {
    if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('savedEmail', email);
    } else {
        localStorage.removeItem('savedEmail');
    }
}

// ==================== Login Handler ====================
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
        
        if (!email.includes('@') || !email.includes('.')) {
            showMessage('Masukkan email yang valid', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password minimal 6 karakter', 'error');
            return;
        }
        
        setLoading(true);
        showMessage('Memeriksa akun...', 'loading');
        
        try {
            // Set persistence based on remember me
            const persistence = rememberCheckbox?.checked 
                ? browserLocalPersistence 
                : browserSessionPersistence;
            await setPersistence(auth, persistence);
            
            // Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login berhasil:', userCredential.user.email);
            
            // Save email if remember me checked
            saveEmail(email);
            
            showMessage('Berhasil masuk! Mengalihkan ke dashboard...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific Firebase errors
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
                    showMessage('Terjadi kesalahan. Silakan coba lagi', 'error');
            }
            
            // Clear password field on error
            if (passwordInput) passwordInput.value = '';
            passwordInput?.focus();
        } finally {
            setLoading(false);
        }
    });
}

// ==================== Auto Redirect if Already Logged In ====================
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        // Already logged in, redirect to dashboard
        console.log('User already logged in:', user.email);
        window.location.href = 'dashboard.html';
    } else if (user) {
        console.log('User logged in:', user.email);
    }
});

// ==================== Logout Function ====================
export async function logout() {
    try {
        await signOut(auth);
        console.log('Logout berhasil');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==================== Toggle Password Visibility ====================
window.togglePassword = function() {
    const passInput = document.getElementById('password');
    const btn = document.querySelector('.toggle-pass-btn');
    if (!passInput) return;
    
    if (passInput.type === 'password') {
        passInput.type = 'text';
        if (btn) btn.textContent = '🙈';
        btn?.setAttribute('aria-label', 'Sembunyikan password');
    } else {
        passInput.type = 'password';
        if (btn) btn.textContent = '👁️';
        btn?.setAttribute('aria-label', 'Tampilkan password');
    }
};

// Attach toggle function to button (modern way)
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('togglePasswordBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const passInput = document.getElementById('password');
            if (passInput) {
                if (passInput.type === 'password') {
                    passInput.type = 'text';
                    toggleBtn.textContent = '🙈';
                } else {
                    passInput.type = 'password';
                    toggleBtn.textContent = '👁️';
                }
            }
        });
    }
    
    // Load saved email
    loadSavedEmail();
    
    // Focus on email input if empty
    if (emailInput && !emailInput.value) {
        emailInput.focus();
    } else if (passwordInput) {
        passwordInput.focus();
    }
});

// ==================== Forgot Password Handler ====================
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim();
    if (email && email.includes('@')) {
        showMessage(`Link reset password akan dikirim ke ${email}`, 'success');
        // TODO: Implement Firebase password reset
        // await sendPasswordResetEmail(auth, email);
    } else {
        showMessage('Masukkan email Anda terlebih dahulu', 'error');
        emailInput?.focus();
    }
});

// ==================== Register Handler ====================
document.getElementById('registerLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showMessage('Fitur pendaftaran hubungi admin', 'loading');
    // TODO: Implement registration page
});