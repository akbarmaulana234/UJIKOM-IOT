// dashboard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ==================== VARIABLES ====================
let sensorChart = null;
let currentData = {
    suhu: '--',
    cahaya: '--',
    history: [],
    chart: [28, 29, 30, 29, 31, 30, 28]
};

// ==================== AUTH GUARD ====================
onAuthStateChanged(auth, (user) => {
    if (!user && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
    }
    if (user) {
        document.getElementById('userAvatar')?.setAttribute('data-initial', user.email?.[0]?.toUpperCase() || 'U');
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = 'login.html';
});

// ==================== INIT CHART ====================
function initChart() {
    const ctx = document.getElementById('sensorChart')?.getContext('2d');
    if (!ctx) return;
    
    if (sensorChart) sensorChart.destroy();
    
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
            datasets: [
                {
                    label: '🌡️ Suhu (°C)',
                    data: currentData.chart || [28, 29, 30, 29, 31, 30, 28],
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
                    data: [120, 180, 350, 420, 380, 200, 90],
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
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#fff',
                    bodyColor: '#9ca3af',
                    borderColor: '#374151',
                    borderWidth: 1
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#e5e7eb' },
                    title: { display: true, text: 'Nilai' }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Waktu' }
                }
            }
        }
    });
}

// ==================== UPDATE STATS CARDS ====================
function updateStats(data) {
    // Suhu
    const suhu = data.suhu ?? currentData.suhu;
    if (suhu !== '--') {
        document.getElementById('statSuhu').innerHTML = `${suhu}<span style="font-size:14px;">°C</span>`;
        const suhuCard = document.querySelector('.stat-card.gradient-1');
        if (suhu > 35) {
            suhuCard?.setAttribute('data-trend', '🔥 Panas ekstrem');
        } else if (suhu > 30) {
            suhuCard?.setAttribute('data-trend', '⚠️ Hangat');
        } else if (suhu > 25) {
            suhuCard?.setAttribute('data-trend', '✅ Normal');
        } else {
            suhuCard?.setAttribute('data-trend', '❄️ Dingin');
        }
    }
    
    // Cahaya
    const cahaya = data.cahaya ?? currentData.cahaya;
    if (cahaya !== '--') {
        document.getElementById('statCahaya').innerHTML = `${cahaya}<span style="font-size:14px;"> lx</span>`;
        const cahayaCard = document.querySelector('.stat-card.gradient-4');
        if (cahaya > 500) {
            cahayaCard?.setAttribute('data-trend', '☀️ Sangat terang');
        } else if (cahaya > 200) {
            cahayaCard?.setAttribute('data-trend', '💡 Terang');
        } else if (cahaya > 50) {
            cahayaCard?.setAttribute('data-trend', '🌙 Redup');
        } else {
            cahayaCard?.setAttribute('data-trend', '🌑 Gelap');
        }
    }
    
    currentData.suhu = suhu;
    currentData.cahaya = cahaya;
}

// ==================== UPDATE TABLE ====================
function updateTable(history) {
    const tbody = document.getElementById('dataTable');
    if (!tbody) return;
    
    if (!history || history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = history.slice(-8).reverse().map(item => `
        <tr style="animation: fadeInUp 0.3s ease-out;">
            <td>${item.waktu || item.timestamp || '--'}</td>
            <td><span class="sensor-badge ${item.sensor === 'Suhu' ? 'suhu' : 'cahaya'}">${item.sensor || 'Sensor'}</span></td>
            <td><strong>${item.nilai || '--'}</strong></td>
            <td><span class="status-badge ${item.status === 'OK' ? 'success' : item.status === 'WARN' ? 'warning' : 'danger'}">${item.status || 'Normal'}</span></td>
        </tr>
    `).join('');
}

// ==================== UPDATE ACTIVITY ====================
function updateActivity(message, type = 'info') {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const dotClass = type === 'online' ? 'online' : type === 'warning' ? 'warn' : 'off';
    const icon = type === 'online' ? '🟢' : type === 'warning' ? '🟡' : '🔴';
    
    const newItem = document.createElement('li');
    newItem.style.animation = 'slideInRight 0.3s ease-out';
    newItem.innerHTML = `<span class="dot ${dotClass}"></span> ${icon} ${message} <small>${timeStr}</small>`;
    
    activityList.insertBefore(newItem, activityList.firstChild);
    
    // Batasi maksimal 10 item
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

// ==================== RELAY CONTROL ====================
const relayRef = ref(db, 'relay/1');
const relayToggle = document.getElementById('relayToggle');
const relayLabel = document.getElementById('relayLabel');
const relayStatus = document.getElementById('relayStatus');

// Listen relay state dari Firebase
if (relayRef) {
    onValue(relayRef, (snapshot) => {
        const val = snapshot.val();
        const isOn = val === 1 || val === true || val === '1';
        
        if (relayToggle) relayToggle.checked = isOn;
        if (relayLabel) relayLabel.textContent = isOn ? 'ON' : 'OFF';
        if (relayLabel) relayLabel.style.color = isOn ? '#10b981' : '#6b7280';
        if (relayStatus) {
            relayStatus.innerHTML = isOn 
                ? '<span class="pulse-green"></span> Perangkat aktif (ON)' 
                : '<span class="pulse-gray"></span> Perangkat non-aktif (OFF)';
        }
        
        // Update aktivitas
        if (typeof lastRelayState !== 'undefined' && lastRelayState !== isOn) {
            updateActivity(`Relay ${isOn ? 'dinyalakan' : 'dimatikan'} secara ${lastSource === 'manual' ? 'manual' : 'otomatis'}`, isOn ? 'online' : 'off');
        }
        lastRelayState = isOn;
    });
}

let lastRelayState = undefined;
let lastSource = 'manual';

// Toggle relay
if (relayToggle) {
    relayToggle.addEventListener('change', async () => {
        const newState = relayToggle.checked ? 1 : 0;
        lastSource = 'manual';
        
        try {
            await set(relayRef, newState);
            updateActivity(`Relay ${newState === 1 ? 'dinyalakan' : 'dimatikan'} manual`, newState === 1 ? 'online' : 'off');
            
            // Tambah ke history
            const historyRef = ref(db, 'sensor/history');
            const snapshot = await get(historyRef);
            let history = snapshot.val() || [];
            if (!Array.isArray(history)) history = [];
            
            history.push({
                waktu: new Date().toLocaleTimeString('id-ID'),
                tanggal: new Date().toISOString().split('T')[0],
                sensor: 'Relay',
                nilai: newState === 1 ? 'ON' : 'OFF',
                status: 'OK'
            });
            
            if (history.length > 50) history = history.slice(-50);
            await set(historyRef, history);
            
        } catch (err) {
            console.error('Gagal kontrol relay:', err);
            relayToggle.checked = !relayToggle.checked;
            updateActivity('Gagal mengontrol relay', 'off');
        }
    });
}

// ==================== SENSOR DATA LISTENER ====================
const sensorRef = ref(db, 'sensor');

onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        loadDummyData();
        return;
    }
    
    updateStats(data);
    updateTable(data.history || []);
    
    // Update chart
    if (data.chart && Array.isArray(data.chart) && sensorChart) {
        sensorChart.data.datasets[0].data = data.chart;
        sensorChart.update('active');
    }
    
    // Update aktivitas jika ada perubahan signifikan
    if (currentData.suhu !== data.suhu && data.suhu) {
        const change = data.suhu - (currentData.suhu || 0);
        if (Math.abs(change) > 2) {
            updateActivity(`Suhu ${change > 0 ? 'naik' : 'turun'} ${Math.abs(change)}°C (${data.suhu}°C)`, change > 0 ? 'warning' : 'info');
        }
    }
    
    currentData = { ...currentData, ...data };
}, (error) => {
    console.error('Error membaca sensor:', error);
    loadDummyData();
});

// ==================== DUMMY DATA (Fallback) ====================
async function loadDummyData() {
    try {
        const dummyData = {
            suhu: 28,
            cahaya: 180,
            history: [
                { waktu: '08:00', sensor: 'Suhu', nilai: '28°C', status: 'OK' },
                { waktu: '09:00', sensor: 'Cahaya', nilai: '180 lx', status: 'OK' },
                { waktu: '10:00', sensor: 'Suhu', nilai: '29°C', status: 'OK' },
                { waktu: '11:00', sensor: 'Cahaya', nilai: '350 lx', status: 'OK' }
            ],
            chart: [28, 29, 30, 29, 31, 30, 28]
        };
        updateStats(dummyData);
        updateTable(dummyData.history);
        if (sensorChart) {
            sensorChart.data.datasets[0].data = dummyData.chart;
            sensorChart.update('active');
        }
        updateActivity('Mode demo: menggunakan data lokal', 'info');
    } catch (e) {
        console.warn('Gagal load dummy:', e);
    }
}

// ==================== RANGE SELECTOR ====================
document.getElementById('rangeSelect')?.addEventListener('change', (e) => {
    const range = e.target.value;
    updateActivity(`Filter grafik: ${range}`, 'info');
    // Logika filter bisa ditambah sesuai kebutuhan
});

// ==================== REFRESH BUTTON ====================
document.getElementById('refreshBtn')?.addEventListener('click', () => {
    updateActivity('Memuat ulang data sensor...', 'info');
    // Force refresh
    if (sensorRef) {
        get(sensorRef).then(() => {
            updateActivity('Data berhasil dimuat ulang', 'online');
        });
    }
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateActivity('Dashboard siap - monitoring realtime aktif', 'online');
});

// Export untuk digunakan di file lain
window.updateActivity = updateActivity;