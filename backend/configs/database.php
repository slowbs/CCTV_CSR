<?php

$host = '127.0.0.1';
$user = 'slowbs';
$password = '1596321';
$db = 'cctv';

try{
    $conn = mysqli_connect($host, $user, $password, $db);
    mysqli_set_charset($conn, "utf8mb4");
    
    if(!$conn){
        // echo "Connection failed: ".mysqli_connect_error();
        http_response_code(500);
        echo json_encode([
            'message' => 'Connect DB Error นะจ้ะ',
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
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit();
}