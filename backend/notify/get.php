<?php

$sql = "SELECT COUNT(*) as count FROM log_ping WHERE ping_checked = '1' AND (comment IS NULL OR comment = '')";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

echo json_encode([
                    'message' => 'test ทดสอบ',
                    'result' => $result
                    ], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);