<?php


if (isset($_SESSION['login'])) {
    if (empty($_SESSION['login'])) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Session is required'
        ]));
    }

    unset($_SESSION['login']);
    echo json_encode([
        'message' => 'Logout from backend',
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(400);
    exit(json_encode([
        'message' => 'The Session is invalid'
    ]));
}
