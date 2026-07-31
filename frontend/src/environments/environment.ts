export const environment = {
    production: false,
    API_LOCALHOST: '/CCTV_CSR/backend/index.php/api/', // Absolute path for both dev (via proxy) and production
    API_LOCALIP: 'http://192.168.201.40/CCTV_CSR/backend/index.php/api/', // For access via local IP
    API_NGROK: '/CCTV_CSR/backend/index.php/api/', // ใช้ Path แบบนี้เพื่อให้ทำงานได้กับทุก URL ทั้ง ngrok และ tailscale
    //API_NGROK: 'https://elephantoid-ivy-unemotionally.ngrok-free.dev/CCTV_CSR/backend/index.php/api/', // ใช้ Path แบบนี้เพื่อให้ทำงานได้กับทุก ngrok url
    // USE_PROXY: false, // กำหนดไม่ให้ใช้ Proxy ใน Production
};
