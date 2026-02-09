<?php

if (isset($_GET['log_id'])) {
    $log_id = $_GET['log_id'];
    
    if (empty($log_id)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'log_id is required'
        ], JSON_UNESCAPED_UNICODE));
    }

    $query = "DELETE FROM log_ping WHERE log_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'i', $log_id);
    mysqli_stmt_execute($stmt);

    $error_message = mysqli_error($conn);
    if ($error_message) {
        http_response_code(500);
        exit(json_encode([
            'message' => $error_message
        ], JSON_UNESCAPED_UNICODE));
    }

    $affected_rows = mysqli_affected_rows($conn);
    if ($affected_rows === 0) {
        http_response_code(404);
        exit(json_encode([
            'message' => 'ไม่พบ Log ที่ต้องการลบ'
        ], JSON_UNESCAPED_UNICODE));
    }

    exit(json_encode([
        'message' => 'ลบ Log สำเร็จ'
    ], JSON_UNESCAPED_UNICODE));

} else {
    http_response_code(400);
    echo json_encode([
        'message' => 'กรุณาระบุ log_id'
    ], JSON_UNESCAPED_UNICODE);
}
