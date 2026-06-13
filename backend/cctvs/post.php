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

    // กำหนดค่าเริ่มต้นสำหรับฟิลด์ที่ส่งมาไม่ครบ
    $data->model = $data->model ?? '';
    $data->location = $data->location ?? '';
    $data->monitor = $data->monitor ?? '';
    $data->ip = $data->ip ?? '';
    $maintenance_mode = $data->maintenance_mode ?? 0;
    $data->switch_name = $data->switch_name ?? null;

    $query = "INSERT INTO cctv (durable_no, durable_name, brand, model, location, type, monitor, ip, floor, status, maintenance_mode, count_ping, switch_name) VALUES (?, ?, ?, ?, ?, ?, ?, ? ,? ,?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $query);
    
    if (!$stmt) {
        http_response_code(500);
        exit(json_encode([
            'message' => 'เกิดข้อผิดพลาดในการเตรียมคำสั่ง SQL: ' . mysqli_error($conn)
        ], JSON_UNESCAPED_UNICODE));
    }

    $count_ping = 0; // ค่าเริ่มต้นเป็น 0 สำหรับรายการที่มีใหม่
    mysqli_stmt_bind_param(
        $stmt,
        'sssssissiiiis',
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
        $maintenance_mode,
        $count_ping,
        $data->switch_name
    );
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        exit(json_encode([
            'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . mysqli_stmt_error($stmt)
        ], JSON_UNESCAPED_UNICODE));
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
