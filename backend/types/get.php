<?php

$sql = "SELECT * FROM type WHERE '1' order by `type_id`";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

echo json_encode([
                    'message' => 'test ทดสอบ',
                    'result' => $result
                    ], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);