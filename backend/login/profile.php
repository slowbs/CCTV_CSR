<?php


if (isset($_SESSION['login']) && !empty($_SESSION['login'])) {
    $user_id = $_SESSION['login'];
    $query = mysqli_query($conn, "SELECT * FROM user where user_id = '$user_id'");
    $result = mysqli_fetch_assoc($query);
    exit(json_encode([
        'message' => 'Profile API',
        'session' => $result
    ], JSON_UNESCAPED_UNICODE));
} else {
    http_response_code(400);
    exit(json_encode([
        'message' => 'Cannot Access this Page caue Session is required'
    ]));
}
