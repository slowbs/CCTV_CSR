<?php

$sql = "SELECT * FROM user WHERE '1'";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

echo json_encode([
                    'message' => 'Profile API',
                    // 'result' => $result,
                    'session' => $_SESSION['login']
                    ], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);