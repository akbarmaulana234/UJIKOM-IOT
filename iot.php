<?php
// ============================================
// iot.php - Bridge untuk BACA PERINTAH RELAY
// ============================================

// ✅ URL Firebase (jangan lupa slash di akhir)
$firebase_url = "https://ujikom-2026-default-rtdb.asia-southeast1.firebasedatabase.app/";

// Mode test, kosongkan saja
$firebase_secret = ""; 

header('Content-Type: text/plain');

// ============ HANDLE PERMINTAAN DARI ESP8266 ============
if (isset($_GET['action'])) {
    $action = $_GET['action'];
    
    // PERINTAH GET RELAY (dibaca ESP8266)
    if ($action == 'get_relay') {
        // Ambil data relay dari Firebase
        $url = $firebase_url . "relay/1.json";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode == 200) {
            echo "relay=" . $response;
        } else {
            echo "relay=0";
        }
        exit;
    }
    
    // PERINTAH SET RELAY (dari dashboard atau tombol manual)
    if ($action == 'set_relay' && isset($_GET['relay'])) {
        $state = $_GET['relay'];
        
        $url = $firebase_url . "relay/1.json";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(intval($state)));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        echo "OK";
        exit;
    }
}

// Kalau tidak ada parameter action
echo "ESP8266 Bridge is ready";
?>