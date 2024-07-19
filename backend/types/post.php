<?php
$data = json_decode(file_get_contents('php://input'));

if (isset($data->name) && isset($data->room) && isset($data->teacher)) {
    if (empty($data->name)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Studen name is required'
        ]));
    }
    if (empty($data->room)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Studen room is required'
        ]));
    }
    if (empty($data->teacher)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Studen teacher is required'
        ]));
    }

    //กรณีที่เงือนไขครบถ้วน
    // echo json_encode([
    //     'message' => 'valid',
    //     'data' => $data->name
    // ]);
    $query = "INSERT INTO student (name, room, teacher) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'sss',
        $data->name,
        $data->room,
        $data->teacher
    );
    mysqli_stmt_execute($stmt);
    $error_message = mysqli_error($conn);

    if($error_message){ //ใช้ในการ เช็ค error
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