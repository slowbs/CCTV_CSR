<?php

$sql = "SELECT id, durable_no, durable_name, brand, location, floor.floor_name as floor, status.status_name as status, monitor, ip, ping,
cctv.date_updated, cctv.status as status_id, cctv.floor as floor_id, floor.order as floor_order, notify FROM cctv
left join floor on cctv.floor = floor.floor_id
left join status on cctv.status = status.status_id
where cctv.type = 1
order by floor_order";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

echo json_encode([
    'message' => 'test ทดสอบ',
    'result' => $result
], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);