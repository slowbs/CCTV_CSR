<?php

// $sql = "SELECT * FROM status WHERE '1'";
// $query = mysqli_query($conn, $sql);
// $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

// echo json_encode([
//     'message' => 'test ทดสอบ',
//     'result' => $result
// ], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);

if (isset($_SESSION['login']) && !empty($_SESSION['login'])) {
    // $sql = "SELECT * FROM user WHERE '1'";
    $sql = "SELECT user_id, user_name, name, status FROM user WHERE '1'";
    $query = mysqli_query($conn, $sql);
    $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

    echo json_encode([
        'message' => 'test ทดสอบ',
        'result' => $result
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(401);
    exit(json_encode([
        'message' => 'Cannot Access this Page cause Session is required'
    ]));
}
