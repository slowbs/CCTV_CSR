<?php

$sql = "SELECT * FROM user WHERE '1'";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

if (isset($_SESSION['login'])) {
    if (empty($_SESSION['login'])) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Session is required'
        ]));
    }

    echo json_encode([
        'message' => 'Profile API',
        // 'result' => $result,
        'session' => $_SESSION['login']
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