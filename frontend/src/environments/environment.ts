export const environment = {
    production: false,
    API_LOCALHOST: '/CCTV_CSR/backend/index.php/api/', // Absolute path for both dev (via proxy) and production
    API_LOCALIP: 'http://192.168.201.40/CCTV_CSR/backend/index.php/api/', // For access via local IP
    API_NGROK: 'YOUR_NGROK_URL/cctv_csr/backend/index.php/api/', // แทนที่ด้วย URL ของ Ngrok ของคุณ
    // USE_PROXY: false, // กำหนดไม่ให้ใช้ Proxy ใน Production
};
