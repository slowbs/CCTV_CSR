<?php
$data = json_decode(file_get_contents('php://input'));

if (isset($data->user_name) && isset($data->name) && isset($data->password) && isset($data->c_password) && isset($data->status)) {
    if (empty($data->user_name)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'User_name name is required'
        ]));
    }
    if (empty($data->name)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Name is required'
        ]));
    }
    if (empty($data->password)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Password is required'
        ]));
    }
    if (empty($data->c_password)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'C_Password is required'
        ]));
    }
    if (empty($data->status)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Status is required'
        ]));
    }

    // กรณีที่เงือนไขครบถ้วน (สำหรับเช็ค)
    // echo json_encode([
    //     'message' => 'valid',
    //     'data' => $data->name
    // ]);

    //กรณีที่เงือนไขครบถ้วน (สำหรับส่งค่าจริง)
    $query = "INSERT INTO user (user_name, name, password, status) VALUES (?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param(
        $stmt,
        'ssss',
        $data->user_name,
        $data->name,
        $data->password,
        $data->status
    );
    mysqli_stmt_execute($stmt);
    $error_message = mysqli_error($conn);

    if ($error_message) { //ใช้ในการ เช็ค error
        http_response_code(500);
        exit(json_encode([
            'message' => $error_message
        ]));
    }

    echo json_encode([
        'message' => 'เพิ่มสำเร็จ'
    ]);
} else {
    http_response_code(400);
    exit(json_encode([
        'message' => 'The request is invalid'
    ]));
}

// echo json_encode([
//     'message' => 'สวัสดี World POST',
//     // 'Post_Data' => 'Text : ' . $data->message
//     'Post_Data' => $data->name
//     // 'Post_Data' => $data
// ], JSON_UNESCAPED_UNICODE);