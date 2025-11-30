<?php
$data = json_decode(file_get_contents('php://input'));

if (
    isset($data->durable_no) && isset($data->durable_name) && isset($data->brand)
    && isset($data->floor) && isset($data->status) && isset($data->type)
) {
    if (empty($data->durable_no)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Durable number is required'
        ]));
    }
    if (empty($data->durable_name)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Durable name is required'
        ]));
    }
    if (empty($data->brand)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Brand is required'
        ]));
    }
    if (empty($data->type)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Type is required'
        ]));
    }
    if (empty($data->floor)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Floor is required'
        ]));
    }
    if (empty($data->status)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Status is required'
        ]));
    }

    // หาก ip เป็นค่าว่าง ให้กำหนดเป็น ''
    if (!isset($data->ip)) {
        $data->ip = '';
    }

    //กรณีที่เงือนไขครบถ้วน
    //     'data' => $data->name
    // ]);
    $query = "INSERT INTO cctv (durable_no, durable_name, brand, model, location, type, monitor, ip, floor, status, maintenance_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ? ,? ,?, ?)";
    $stmt = mysqli_prepare($conn, $query);
    $maintenance_mode = isset($data->maintenance_mode) ? $data->maintenance_mode : 0;
    mysqli_stmt_bind_param(
        $stmt,
        'sssssissiii',
        $data->durable_no,
        $data->durable_name,
        $data->brand,
        $data->model,
        $data->location,
        $data->type,
        $data->monitor,
        $data->ip,
        $data->floor,
        $data->status,
        $maintenance_mode
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
