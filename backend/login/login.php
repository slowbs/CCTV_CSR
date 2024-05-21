<?php
$data = json_decode(file_get_contents('php://input'));

if (isset($data->user_name) && isset($data->password)) {
    if (empty($data->user_name)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'User_name name is required'
        ]));
    }
    if (empty($data->password)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'Password is required'
        ]));
    }

    $user_name = mysqli_real_escape_string($conn, $data->user_name);
    $password = mysqli_real_escape_string($conn, $data->password);
    $query = mysqli_query($conn, "
    SELECT * from user
    WHERE user_name = '$user_name' AND password = '$password' 
    ");

    $result = mysqli_fetch_array($query, MYSQLI_ASSOC);
    if (empty($result)) {
        http_response_code(400);
        exit(json_encode([
            'message' => 'User_name หรือ Password ไม่ถูกต้อง'
        ]));
    }

    // $_SESSION['login'] = $result;
    $_SESSION['login'] = $result['user_id'];
    exit(json_encode([
        'message' => 'Login สำเร็จ',
        // 'data' => $result,
    ]));
} else {
    http_response_code(400);
    exit(json_encode([
        'message' => 'The request is invalid'
    ]));
}
