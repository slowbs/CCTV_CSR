<?php

// คำสั่ง SQL สำหรับนับจำนวนครุภัณฑ์ตามประเภทและสถานะจากคอลัมน์ ping
$sql = "SELECT cctv.type, 
               SUM(CASE WHEN cctv.ping = 0 THEN 1 ELSE 0 END) AS online_count,
               SUM(CASE WHEN cctv.ping = 1 THEN 1 ELSE 0 END) AS offline_count
        FROM cctv
        GROUP BY cctv.type";

// รันคำสั่ง SQL
$result = $conn->query($sql);

if ($result) {
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = [
            'type' => $row['type'],
            'online_count' => (int)$row['online_count'],
            'offline_count' => (int)$row['offline_count']
        ];
    }

    echo json_encode([
        'message' => 'Data fetched successfully',
        'result' => $data
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'message' => 'Error executing query: ' . $conn->error
    ], JSON_UNESCAPED_UNICODE);
}
