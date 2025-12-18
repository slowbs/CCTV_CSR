<?php

$host = '127.0.0.1';
$user = 'slowbs';
$password = '1596321';

// Auto-switch database ตาม Host ที่เรียกเข้ามา
// localhost / 127.0.0.1 → cctv_test (UAT/Development)
// 192.168.x.x หรืออื่นๆ → cctv (Production)
$http_host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$is_localhost = ($http_host === 'localhost' || 
                 $http_host === '127.0.0.1' || 
                 strpos($http_host, 'localhost:') === 0 ||
                 strpos($http_host, '127.0.0.1:') === 0);

$db = $is_localhost ? 'cctv_test' : 'cctv';

try{
    $conn = mysqli_connect($host, $user, $password, $db);
    mysqli_set_charset($conn, "utf8mb4");
    
    if(!$conn){
        // echo "Connection failed: ".mysqli_connect_error();
        http_response_code(500);
        echo json_encode([
            'message' => 'Connect DB Error นะจ้ะ',
            'db_used' => $db,
            // 'error' => $e->getMessage()
            'error' => mysqli_connect_error()
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}catch(Exception $e){
//    echo 'My error:'. $e->getMessage();
        http_response_code(500);
        echo json_encode([
            'message' => 'Connect DB Error นะจ้ะ',
            'db_used' => $db,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit();
}