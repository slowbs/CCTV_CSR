<?php
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!empty($id)) {

        $sql = "SELECT 
                cctv.id, 
                cctv.durable_no, 
                cctv.durable_name, 
                cctv.location, 
                floor.floor_name AS floor, 
                cctv.status, 
                cctv.ping,
                online_log.date_created AS online, -- ออนไลน์
                offline_log.date_created AS offline -- ออฟไลน์
            FROM cctv
            LEFT JOIN floor ON cctv.floor = floor.floor_id
            LEFT JOIN log_ping AS online_log 
                ON cctv.id = online_log.cctv_id 
                AND online_log.ping_checked = 0 -- ออนไลน์
                AND online_log.date_created = (SELECT MAX(date_created) FROM log_ping WHERE cctv_id = cctv.id AND ping_checked = 0)
            LEFT JOIN log_ping AS offline_log 
                ON cctv.id = offline_log.cctv_id 
                AND offline_log.ping_checked = 1 -- ออฟไลน์
                AND offline_log.date_created = (SELECT MAX(date_created) FROM log_ping WHERE cctv_id = cctv.id AND ping_checked = 1)
            WHERE cctv.type = $id
            ORDER BY floor.order, cctv.durable_no;";
        $query = mysqli_query($conn, $sql);
        $result = [];
        while ($row = mysqli_fetch_assoc($query)) {
            $id = $row['id'];
            if (!isset($result[$id])) {
                $result[$id] = [
                    'durable_no' => $row['durable_no'],
                    'durable_name' => $row['durable_name'],
                    'location' => $row['location'],
                    'floor' => $row['floor'],
                    'status' => $row['status'],
                    'ping' => $row['ping'],
                    'logs' => []
                ];
            }
            $result[$id]['logs'][] = [
                'offline' => $row['offline'],
                'online' => $row['online']
            ];
        }

        echo json_encode([
            'message' => 'test ทดสอบ',
            'result' => $result
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(
            [
                'message' => 'Parameter is NOT VALID'
            ],
            JSON_UNESCAPED_UNICODE
        );
    }
} else {
    echo json_encode(
        [
            'message' => 'Parameter is Requested'
        ],
        JSON_UNESCAPED_UNICODE
    );
}
