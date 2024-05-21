<?php

if (isset($_SESSION['login'])) {
    if (empty($_SESSION['login'])) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Session is required'
        ]));
    }

    $user_id = $_SESSION['login'];
    $sql = "SELECT * FROM user WHERE user_id = '$user_id'";
    $query = mysqli_query($conn, $sql);
    $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

    echo json_encode([
        'message' => 'Profile API',
        // 'result' => $result,
        'session' => $result
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(400);
    exit(json_encode([
        'message' => 'The Session is invalid'
    ]));
}


// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);