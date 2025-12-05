<?php
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!empty($id)) {
        // รับค่าช่วงวันที่จาก GET (รูปแบบ 'yyyy-mm-dd')
        $startDate = isset($_GET['startDate']) && !empty($_GET['startDate']) ? $_GET['startDate'] : null;
        $endDate = isset($_GET['endDate']) && !empty($_GET['endDate']) ? $_GET['endDate'] : null;

        // Query ดึงข้อมูลทั้งหมดโดยไม่กรอง log ด้วยช่วงวันที่ใน SQL
        $sql = "SELECT 
                    cctv.id, 
                    cctv.durable_no, 
                    cctv.durable_name, 
                    cctv.location, 
                    cctv.monitor,
                    floor.floor_name AS floor,
                    floor.order as floor_order,
                    cctv.status AS status_id,
                    status.status_name AS status,
                    cctv.ping,
                    offline_log.date_created AS offline,
                    online_log.date_created AS online,
                    offline_log.comment as comment,
                    offline_log.ping_checked as type_offline,
                    online_log.ping_checked as type_online
                FROM cctv
                LEFT JOIN status ON cctv.status = status.status_id
                LEFT JOIN floor ON cctv.floor = floor.floor_id
                LEFT JOIN log_ping AS offline_log 
                    ON cctv.id = offline_log.cctv_id 
                    AND offline_log.ping_checked IN (1, 2)
                LEFT JOIN log_ping AS online_log 
                    ON cctv.id = online_log.cctv_id 
                    AND (
                        (offline_log.ping_checked = 1 AND online_log.ping_checked = 0) OR
                        (offline_log.ping_checked = 2 AND online_log.ping_checked = 3)
                    )
                    AND online_log.date_created = (
                        SELECT MIN(ol.date_created)
                        FROM log_ping ol
                        WHERE ol.cctv_id = offline_log.cctv_id
                          AND ol.date_created > offline_log.date_created
                          AND (
                              (offline_log.ping_checked = 1 AND ol.ping_checked = 0) OR
                              (offline_log.ping_checked = 2 AND ol.ping_checked = 3)
                          )
                    )
                WHERE cctv.type = $id
                ORDER BY floor.order, cctv.durable_no, offline_log.date_created ASC;";

        $query = mysqli_query($conn, $sql);
        $result = [];
        while ($row = mysqli_fetch_assoc($query)) {
            $rowId = $row['id'];
            if (!isset($result[$rowId])) {
                $result[$rowId] = [
                    'durable_no'    => $row['durable_no'],
                    'durable_name'  => $row['durable_name'],
                    'location'      => $row['location'],
                    'monitor'       => $row['monitor'],
                    'floor'         => $row['floor'],
                    'floor_order'   => $row['floor_order'],
                    'status'        => $row['status'],
                    'status_id'     => $row['status_id'],
                    'ping'          => $row['ping'],
                    'logs'          => []
                ];
            }

            // ตรวจสอบเงื่อนไขวันที่สำหรับ log
            $includeLog = true;
            if ($startDate && $endDate) {
                // กรอง log โดยตรวจสอบทั้ง offline และ online
                $offlineDate = $row['offline'];
                $onlineDate = $row['online'];
                $includeLog = false;

                if ($offlineDate) {
                    $dateOffline = date('Y-m-d', strtotime($offlineDate));
                    if ($dateOffline >= $startDate && $dateOffline <= $endDate) {
                        $includeLog = true;
                    }
                }
                if (!$includeLog && $onlineDate) {
                    $dateOnline = date('Y-m-d', strtotime($onlineDate));
                    if ($dateOnline >= $startDate && $dateOnline <= $endDate) {
                        $includeLog = true;
                    }
                }
            }

            if ($includeLog) {
                $result[$rowId]['logs'][] = [
                    'offline'      => $row['offline'],
                    'online'       => isset($row['online']) ? $row['online'] : null,
                    'comment'      => isset($row['comment']) ? $row['comment'] : null,
                    'type_offline' => $row['type_offline'],
                    'type_online'  => $row['type_online']
                ];
            }
        }

        echo json_encode([
            'message' => 'test ทดสอบ',
            'result'  => $result
        ], JSON_UNESCAPED_UNICODE);
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
