<?php

// ตรวจสอบว่ามีพารามิเตอร์ type หรือไม่
if (isset($_GET['type'])) {
    $type = $_GET['type'];

    // ตรวจสอบว่า type ไม่ว่างและเป็นตัวเลข
    if (!empty($type) && is_numeric($type)) {
        // เตรียมคำสั่ง SQL
        $stmt = $conn->prepare("SELECT id, durable_no, durable_name, brand, model, location, floor.floor_name AS floor, status.status_name AS status, monitor, ip, ping,
        cctv.date_updated, cctv.status AS status_id, cctv.floor AS floor_id, floor.order AS floor_order, notify, cctv.maintenance_mode, cctv.map_id, cctv.map_x, cctv.map_y, cctv.image_path
        FROM cctv
        LEFT JOIN floor ON cctv.floor = floor.floor_id
        LEFT JOIN status ON cctv.status = status.status_id
        WHERE cctv.type = ?
        ORDER BY floor_order, monitor");

        // ผูกพารามิเตอร์กับคำสั่ง SQL
        $stmt->bind_param("i", $type); // 'i' indicates the type is integer

        // รันคำสั่ง SQL
        if ($stmt->execute()) {
            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode([
                'message' => 'Data fetched successfully',
                'result' => $result
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'message' => 'Error executing query: ' . $stmt->error
            ], JSON_UNESCAPED_UNICODE);
        }

        // ปิดคำสั่ง SQL
        $stmt->close();
    } else {
        echo json_encode([
            'message' => 'Parameter is NOT VALID'
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode([
        'message' => 'Parameter is Requested'
    ], JSON_UNESCAPED_UNICODE);
}

// ปิดการเชื่อมต่อฐานข้อมูล
$conn->close();
