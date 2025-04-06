export const environment = {
    production: false,
    API_LOCALHOST: '/backend/index.php/api/', // อาจจะไม่จำเป็นต้องใช้ใน Production
    API_LOCALIP: 'http://192.168.201.40/cctv_csr/backend/index.php/api/', // เปลี่ยนเป็น Local IP ของคุณ
    API_NGROK: 'YOUR_NGROK_URL/cctv_csr/backend/index.php/api/', // แทนที่ด้วย URL ของ Ngrok ของคุณ
    // USE_PROXY: false, // กำหนดไม่ให้ใช้ Proxy ใน Production
};
