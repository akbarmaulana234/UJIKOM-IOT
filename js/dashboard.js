// dashboard.js - VERSION WITH FAKE DATA (MOCK SIMULATION)
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, onValue, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ==================== CONFIG ====================
const USE_MOCK_DATA = true;  // Set ke false jika pakai data real dari sensor
const UPDATE_INTERVAL = 3000; // Update setiap 3 detik

// ==================== VARIABLES ====================
let sensorChart = null;
let mockInterval = null;
let currentData = {
    suhu: 26,
    kelembapan: 65,
    tekanan: 1013,
    cahaya: 180,
    relay: 0,
    history: []
};

// ==================== AUTH GUARD ====================
onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
    }
    if (user && document.getElementById('userAvatar')) {
        const initial = user.email ? user.email[0].toUpperCase() : 'U';
        document.getElementById('userAvatar').textContent = initial;
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = 'login.html';
});

// ==================== FAKE DATA GENERATOR ====================
function generateFakeData() {
    // Suhu: antara 24-32°C, kadang naik turun perlahan
    let newSuhu = currentData.suhu + (Math.random() - 0.5) * 0.6;
    newSuhu = Math.min(35, Math.max(22, newSuhu));
    
    // Kelembapan: antara 50-80%, berkorelasi terbalik dengan suhu
    let newKelembapan = 75 - (newSuhu - 25) * 1.2 + (Math.random() - 0.5) * 3;
    newKelembapan = Math.min(85, Math.max(45, newKelembapan));
    
    // Tekanan: antara 1005-1025 hPa
    let newTekanan = currentData.tekanan + (Math.random() - 0.5) * 2;
    newTekanan = Math.min(1030, Math.max(1005, newTekanan));
    
    // Cahaya: antara 50-850 lx (simulasi siang/malam)
    let now = new Date();
    let hour = now.getHours();
    // Simulasi cahaya berdasarkan jam
    let baseLight = 0;
    if (hour >= 6 && hour < 18) {
        // Siang hari: 300-850 lx
        baseLight = 400 + Math.sin((hour - 12) * Math.PI / 12) * 300;
    } else {
        // Malam hari: 20-150 lx
        baseLight = 50 + Math.random() * 100;
    }
    let newCahaya = Math.min(900, Math.max(10, baseLight + (Math.random() - 0.5) * 50));
    
    return {
        suhu: Math.round(newSuhu * 10) / 10,
        kelembapan: Math.round(newKelembapan),
        tekanan: Math.round(newTekanan),
        cahaya: Math.round(newCahaya)
    };
}

// ==================== INIT CHART ====================
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
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#3b82f6'
                },
                {
                    label: '💡 Cahaya (lx)',
                    data: [180, 200, 350, 420, 380, 250, 190],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 500, easing: 'easeInOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: { backgroundColor: '#1f2937', titleColor: '#fff', bodyColor: '#9ca3af' },
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } }
            },
            scales: {
                y: { grid: { color: '#e5e7eb' }, title: { display: true, text: 'Nilai' } },
                x: { grid: { display: false }, title: { display: true, text: 'Waktu' } }
            }
        }
    });
}

// Update chart dengan data baru
function updateChart(suhu, cahaya) {
    if (!sensorChart) return;
    
    // Shift data dan tambah data baru
    const newSuhuData = [...sensorChart.data.datasets[0].data.slice(1), suhu];
    const newCahayaData = [...sensorChart.data.datasets[1].data.slice(1), cahaya];
    
    // Update labels (waktu)
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newLabels = [...sensorChart.data.labels.slice(1), timeLabel];
    
    sensorChart.data.labels = newLabels;
    sensorChart.data.datasets[0].data = newSuhuData;
    sensorChart.data.datasets[1].data = newCahayaData;
    sensorChart.update('active');
}

// ==================== UPDATE UI ====================
function updateUI(data) {
    // Update stat cards
    document.getElementById('statSuhu').innerHTML = `${data.suhu}<span style="font-size:14px;">°C</span>`;
    document.getElementById('statKelembapan').innerHTML = `${data.kelembapan}<span style="font-size:14px;">%</span>`;
    document.getElementById('statTekanan').innerHTML = `${data.tekanan}<span style="font-size:14px;"> hPa</span>`;
    document.getElementById('statCahaya').innerHTML = `${data.cahaya}<span style="font-size:14px;"> lx</span>`;
    
    // Update trend indicators
    updateTrendIndicator('suhu', data.suhu, 26, 32);
    updateTrendIndicator('cahaya', data.cahaya, 100, 600);
    
    // Update detail cards di sensor page (jika ada)
    if (document.getElementById('detailSuhu')) {
        document.getElementById('detailSuhu').innerHTML = `${data.suhu}<span class="sensor-unit">°C</span>`;
        document.getElementById('detailCahaya').innerHTML = `${data.cahaya}<span class="sensor-unit">lx</span>`;
        document.getElementById('detailTekanan').innerHTML = `${data.tekanan}<span class="sensor-unit">hPa</span>`;
    }
    
    // Update chart
    updateChart(data.suhu, data.cahaya);
}

function updateTrendIndicator(sensor, value, minNormal, maxNormal) {
    const trendEl = document.getElementById(`trend${sensor.charAt(0).toUpperCase() + sensor.slice(1)}`);
    if (!trendEl) return;
    
    if (value > maxNormal) {
        trendEl.innerHTML = '↑ Tinggi';
        trendEl.className = 'trend trend-up';
        trendEl.style.color = '#ef4444';
    } else if (value < minNormal) {
        trendEl.innerHTML = '↓ Rendah';
        trendEl.className = 'trend trend-down';
        trendEl.style.color = '#f59e0b';
    } else {
        trendEl.innerHTML = '✓ Normal';
        trendEl.className = 'trend trend-steady';
        trendEl.style.color = '#10b981';
    }
}

// ==================== UPDATE HISTORY TABLE ====================
function updateHistoryTable(data) {
    const tbody = document.getElementById('dataTable');
    if (!tbody) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID');
    const dateStr = now.toLocaleDateString('id-ID');
    
    // Add to history array
    const newEntry = {
        waktu: timeStr,
        tanggal: dateStr,
        suhu: data.suhu,
        kelembapan: data.kelembapan,
        tekanan: data.tekanan,
        cahaya: data.cahaya
    };
    
    currentData.history.unshift(newEntry);
    if (currentData.history.length > 10) currentData.history.pop();
    
    // Render table
    tbody.innerHTML = currentData.history.map(item => `
        <tr style="animation: fadeInUp 0.3s ease-out;">
            <td>${item.waktu}</td>
            <td><span class="sensor-badge suhu">🌡️ Suhu</span></td>
            <td><strong>${item.suhu}°C</strong></td>
            <td><span class="status-badge success">Normal</span></td>
        </tr>
        <tr style="animation: fadeInUp 0.3s ease-out;">
            <td>${item.waktu}</td>
            <td><span class="sensor-badge cahaya">💡 Cahaya</span></td>
            <td><strong>${item.cahaya} lx</strong></td>
            <td><span class="status-badge success">Normal</span></td>
        </tr>
    `).join('');
}

// ==================== UPDATE ACTIVITY ====================
let lastSuhu = null;
function updateActivity(data) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Cek perubahan signifikan
    if (lastSuhu !== null && Math.abs(data.suhu - lastSuhu) > 1) {
        const change = data.suhu - lastSuhu;
        const newItem = document.createElement('li');
        newItem.style.animation = 'slideInRight 0.3s ease-out';
        newItem.innerHTML = `
            <span class="dot ${change > 0 ? 'warn' : 'online'}"></span>
            ${change > 0 ? '📈 Suhu naik' : '📉 Suhu turun'} ${Math.abs(change).toFixed(1)}°C (${data.suhu}°C)
            <small>${timeStr}</small>
        `;
        activityList.insertBefore(newItem, activityList.firstChild);
        
        // Batasi jumlah aktivitas
        while (activityList.children.length > 8) {
            activityList.removeChild(activityList.lastChild);
        }
    }
    
    lastSuhu = data.suhu;
}

// ==================== RELAY CONTROL ====================
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
            ? '<span class="pulse-green"></span> Perangkat aktif (ON) - Kipas/Lampu menyala' 
            : '<span class="pulse-gray"></span> Perangkat non-aktif (OFF)';
    }
}

if (relayToggle) {
    relayToggle.addEventListener('change', async () => {
        const newState = relayToggle.checked ? 1 : 0;
        currentData.relay = newState;
        updateRelayUI(newState === 1);
        
        // Add activity log
        const activityList = document.getElementById('activityList');
        if (activityList) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newItem = document.createElement('li');
            newItem.style.animation = 'slideInRight 0.3s ease-out';
            newItem.innerHTML = `
                <span class="dot online"></span>
                🎮 Relay ${newState === 1 ? 'dinyalakan' : 'dimatikan'} melalui dashboard
                <small>${timeStr}</small>
            `;
            activityList.insertBefore(newItem, activityList.firstChild);
        }
        
        // Simpan ke Firebase (optional)
        if (db && !USE_MOCK_DATA) {
            const relayRef = ref(db, 'relay/1');
            await set(relayRef, newState);
        }
    });
}

// ==================== MOCK DATA LOOP ====================
function startMockSimulation() {
    if (mockInterval) clearInterval(mockInterval);
    
    mockInterval = setInterval(() => {
        const newData = generateFakeData();
        currentData = { ...currentData, ...newData };
        
        // Update UI
        updateUI(currentData);
        updateHistoryTable(currentData);
        updateActivity(currentData);
        
        // Update connection status (always online)
        const connStatus = document.getElementById('connectionStatus');
        if (connStatus) {
            connStatus.textContent = 'Online';
            connStatus.parentElement?.querySelector('.dot')?.classList.add('online');
        }
        
    }, UPDATE_INTERVAL);
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    startMockSimulation();
    
    // Set initial relay state
    updateRelayUI(0);
    
    // Add initial activity
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.innerHTML = `
            <li><span class="dot online"></span> 🟢 Sistem monitoring dimulai <small>sekarang</small></li>
            <li><span class="dot online"></span> 📡 Mode simulasi data aktif <small>sekarang</small></li>
            <li><span class="dot online"></span> 🔄 Update data setiap ${UPDATE_INTERVAL/1000} detik <small>sekarang</small></li>
        `;
    }
    
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        const newData = generateFakeData();
        currentData = { ...currentData, ...newData };
        updateUI(currentData);
        updateHistoryTable(currentData);
        
        const activityList = document.getElementById('activityList');
        if (activityList) {
            const now = new Date();
            const newItem = document.createElement('li');
            newItem.innerHTML = `<span class="dot online"></span> 🔄 Manual refresh data <small>${now.toLocaleTimeString('id-ID')}</small>`;
            activityList.insertBefore(newItem, activityList.firstChild);
        }
    });
});

// Export for debugging
window.currentData = currentData;