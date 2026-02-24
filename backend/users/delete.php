<?php

if (!isset($_SESSION['login']) || empty($_SESSION['login'])) {
    http_response_code(401);
    exit(json_encode([
        'message' => 'Session is required'
    ], JSON_UNESCAPED_UNICODE));
}

if (!isset($_GET['user_id'])) {
    http_response_code(400);
    exit(json_encode([
        'message' => 'user_id is required'
    ], JSON_UNESCAPED_UNICODE));
}

$user_id = $_GET['user_id'];
if ($user_id === '' || !is_numeric($user_id)) {
    http_response_code(400);
    exit(json_encode([
        'message' => 'user_id is invalid'
    ], JSON_UNESCAPED_UNICODE));
}

$query = "DELETE FROM user WHERE user_id = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, 'i', $user_id);
mysqli_stmt_execute($stmt);

$error_message = mysqli_error($conn);
if ($error_message) {
    http_response_code(500);
    exit(json_encode([
        'message' => $error_message
    ], JSON_UNESCAPED_UNICODE));
}

$affected = mysqli_affected_rows($conn);
if ($affected === 0) {
    http_response_code(404);
    exit(json_encode([
        'message' => 'ไม่พบผู้ใช้งานที่ต้องการลบ'
    ], JSON_UNESCAPED_UNICODE));
}

echo json_encode([
    'message' => 'ลบผู้ใช้งานสำเร็จ'
], JSON_UNESCAPED_UNICODE);
