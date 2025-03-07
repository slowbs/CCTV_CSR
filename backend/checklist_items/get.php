<?php
$sql = "SELECT id, task, schedule FROM checklist_items";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

http_response_code(200);
echo json_encode($result, JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);