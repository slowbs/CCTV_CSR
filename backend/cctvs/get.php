<?php

// $sql = "SELECT * FROM cctv WHERE '1' 
// order by date_created desc limit 4";
$sql = "SELECT id, durable_no, durable_name, brand, location, floor.floor_name as floor, status.status_name as status, monitor, ip, ping,
cctv.date_updated, cctv.status as status_id, cctv.floor as floor_id, floor.order as floor_order, notify FROM cctv
left join floor on cctv.floor = floor.floor_id
left join status on cctv.status = status.status_id
where 1
order by floor_order";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

// if (mysqli_num_rows($query) > 0) {
//     $i = 0;
//     // output data of each row
//     while ($result = $query->fetch_assoc()) {
//         // $result["ip_status"] = '1';
//         $ip = $result["ip"];
//         exec("ping -n 1 $ip", $output, $status);
//         if ($status == 0)
//             $result["ip_status"] = '1';
//         else
//             $result["ip_status"] = '0';
//         $data[$i] = $result;
//         $i++;
//     }
// } else {
//     echo "0 results";
// }

echo json_encode([
    'message' => 'test ทดสอบ',
    'result' => $result
], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);