// ============================================
// DASHBOARD - REALTIME SENSOR & RELAY CONTROL
// ============================================

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ============ AUTH GUARD ============
onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname.includes('dashboard.html')) {
        console.log('User belum login, redirect ke login');
        window.location.href = 'login.html';
    }
    if (user && document.getElementById('userAvatar')) {
        const initial = user.email ? user.email[0].toUpperCase() : 'U';
        document.getElementById('userAvatar').textContent = initial;
    }
});

// ============ LOGOUT ============
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = 'login.html';
});

// ============ MOCK DATA (SEMENTARA) ============
let currentData = {
    suhu: 27,
    kelembapan: 65,
    tekanan: 1013,
    cahaya: 180
};

// ============ UPDATE UI ============
function updateUI(data) {
    // Update stat cards
    const statSuhu = document.getElementById('statSuhu');
    const statCahaya = document.getElementById('statCahaya');
    
    if (statSuhu) statSuhu.innerHTML = `${data.suhu}<span style="font-size:14px;">°C</span>`;
    if (statCahaya) statCahaya.innerHTML = `${data.cahaya}<span style="font-size:14px;"> lx</span>`;
    
    // Update detail jika ada
    if (document.getElementById('detailSuhu')) {
        document.getElementById('detailSuhu').innerHTML = `${data.suhu}<span class="sensor-unit">°C</span>`;
        document.getElementById('detailCahaya').innerHTML = `${data.cahaya}<span class="sensor-unit">lx</span>`;
    }
}

// ============ GENERATE FAKE DATA ============
function generateFakeData() {
    let newSuhu = currentData.suhu + (Math.random() - 0.5) * 0.6;
    newSuhu = Math.min(35, Math.max(22, newSuhu));
    
    let newCahaya = currentData.cahaya + (Math.random() - 0.5) * 20;
    newCahaya = Math.min(900, Math.max(10, newCahaya));
    
    return {
        suhu: Math.round(newSuhu * 10) / 10,
        kelembapan: Math.round(70 - (newSuhu - 25) * 1.2),
        tekanan: Math.round(1013 + (Math.random() - 0.5) * 5),
        cahaya: Math.round(newCahaya)
    };
}

// ============ RELAY CONTROL ============
const relayToggle = document.getElementById('relayToggle');
const relayLabel = document.getElementById('relayLabel');
const relayStatus = document.getElementById('relayStatus');

function updateRelayUI(isOn) {
    if (relayToggle) relayToggle.checked = isOn;
    if (relayLabel) {
        relayLabel.textContent = isOn ? 'ON' : 'OFF';
        relayLabel.style.color = isOn ? '#10b981' : '#6b7280';
    }
    if (relayStatus) {
        relayStatus.innerHTML = isOn 
            ? '<span class="pulse-green"></span> Perangkat aktif (ON)'
            : '<span class="pulse-gray"></span> Perangkat non-aktif (OFF)';
    }
}

if (relayToggle) {
    relayToggle.addEventListener('change', async () => {
        const newState = relayToggle.checked ? 1 : 0;
        updateRelayUI(newState === 1);
        
        // Simpan ke localStorage sementara (karena Firebase mungkin belum konek)
        localStorage.setItem('relay_state', newState);
        
        // Tambah activity log
        const activityList = document.getElementById('activityList');
        if (activityList) {
            const now = new Date();
            const newItem = document.createElement('li');
            newItem.innerHTML = `
                <span class="dot online"></span>
                🎮 Relay ${newState === 1 ? 'dinyalakan' : 'dimatikan'}
                <small>${now.toLocaleTimeString()}</small>
            `;
            activityList.insertBefore(newItem, activityList.firstChild);
        }
    });
}

// ============ INIT CHART ============
let sensorChart = null;

function initChart() {
    const ctx = document.getElementById('sensorChart')?.getContext('2d');
    if (!ctx) return;
    
    if (sensorChart) sensorChart.destroy();
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['', '', '', '', '', '', ''],
            datasets: [
                {
                    label: '🌡️ Suhu (°C)',
                    data: [26, 27, 26.5, 27.2, 28, 27.5, 27],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 500 }
        }
    });
}

function updateChart(suhu) {
    if (!sensorChart) return;
    const newData = [...sensorChart.data.datasets[0].data.slice(1), suhu];
    sensorChart.data.datasets[0].data = newData;
    sensorChart.update('active');
}

// ============ SIMULASI DATA REALTIME ============
let interval = null;

function startSimulation() {
    if (interval) clearInterval(interval);
    
    interval = setInterval(() => {
        const newData = generateFakeData();
        currentData = newData;
        updateUI(currentData);
        updateChart(currentData.suhu);
        
        // Update connection status
        const connStatus = document.getElementById('connectionStatus');
        if (connStatus) connStatus.textContent = 'Online';
    }, 3000);
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    startSimulation();
    
    // Load saved relay state
    const savedRelay = localStorage.getItem('relay_state');
    if (savedRelay !== null) {
        updateRelayUI(savedRelay === '1');
    } else {
        updateRelayUI(0);
    }
    
    // Initial activity
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.innerHTML = `
            <li><span class="dot online"></span> 🟢 Dashboard siap <small>sekarang</small></li>
            <li><span class="dot online"></span> 📡 Mode simulasi aktif <small>sekarang</small></li>
        `;
    }
    
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        const newData = generateFakeData();
        currentData = newData;
        updateUI(currentData);
        updateChart(currentData.suhu);
    });
});

console.log('✅ Dashboard.js loaded');