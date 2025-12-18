<?php

$sql = "SELECT 
            c.durable_no, c.durable_name, c.type, lp.date_created, lp.cctv_id, lp.ping_checked,
            CASE 
                WHEN lp.ping_checked = '1' THEN 'offline'
                WHEN lp.ping_checked = '2' THEN 'ma'
                ELSE 'unknown'
            END as notify_type
        FROM 
            log_ping lp
        INNER JOIN 
            cctv c ON lp.cctv_id = c.id
        WHERE 
            lp.ping_checked IN ('1', '2') AND (lp.comment IS NULL OR lp.comment = '')";

$result = $conn->query($sql);

$notifications = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
}

echo json_encode(['result' => $notifications], JSON_UNESCAPED_UNICODE);