<?php

// คำสั่ง SQL สำหรับนับจำนวนครุภัณฑ์ตามประเภทและสถานะจากคอลัมน์ ping
$sqlCount = "SELECT cctv.type, 
                     SUM(CASE WHEN cctv.ping = 0 THEN 1 ELSE 0 END) AS online_count,
                     SUM(CASE WHEN cctv.ping = 1 THEN 1 ELSE 0 END) AS offline_count
              FROM cctv
              GROUP BY cctv.type";

// รันคำสั่ง SQL สำหรับนับจำนวนครุภัณฑ์
$resultCount = $conn->query($sqlCount);
$countData = [];

if ($resultCount) {
    while ($row = $resultCount->fetch_assoc()) {
        $countData[] = [
            'type' => $row['type'],
            'online_count' => (int)$row['online_count'],
            'offline_count' => (int)$row['offline_count']
        ];
    }
} else {
    echo json_encode([
        'message' => 'Error executing query for count: ' . $conn->error
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// คำสั่ง SQL สำหรับดึงข้อมูลการเปลี่ยนแปลงสถานะล่าสุด
$sqlLog = "SELECT log_id, cctv_id, ping_checked, 
                  DATE_FORMAT(log_ping.date_created, '%Y-%m-%d %H:%i') AS date_created,
                  cctv.durable_no AS durable_no, 
                  cctv.durable_name AS durable_name, 
                  floor_name, location, 
                  cctv.monitor AS monitor, 
                  cctv.ip AS ip,
                  log_ping.type as type
           FROM log_ping
           LEFT JOIN cctv ON cctv.id = log_ping.cctv_id
           LEFT JOIN floor ON cctv.floor = floor.floor_id
           ORDER BY log_ping.date_created DESC 
           LIMIT 5"; // ดึงข้อมูลล่าสุด 5 รายการ

// รันคำสั่ง SQL สำหรับดึงข้อมูลการเปลี่ยนแปลงสถานะล่าสุด
$resultLog = $conn->query($sqlLog);
$logData = [];

if ($resultLog) {
    while ($row = $resultLog->fetch_assoc()) {
        $logData[] = [
            'log_id' => $row['log_id'],
            'cctv_id' => $row['cctv_id'],
            'ping_checked' => $row['ping_checked'],
            'date_created' => $row['date_created'],
            'durable_no' => $row['durable_no'],
            'durable_name' => $row['durable_name'],
            'floor_name' => $row['floor_name'],
            'location' => $row['location'],
            'monitor' => $row['monitor'],
            'ip' => $row['ip'],
            'type' => $row['type']
        ];
    }
} else {
    echo json_encode([
        'message' => 'Error executing query for logs: ' . $conn->error
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ส่งข้อมูลทั้งหมดเป็น JSON
echo json_encode([
    'message' => 'Data fetched successfully',
    'counts' => $countData,
    'logs' => $logData
], JSON_UNESCAPED_UNICODE);
