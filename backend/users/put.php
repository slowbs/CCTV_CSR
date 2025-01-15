<?php

$data = json_decode(file_get_contents('php://input'));

// print_r($data);
if (isset($_GET['user_id'])) {
    if (isset($data->user_name) && isset($data->name) && isset($data->status)) {
        if (empty($data->user_name)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'User Name is required'
            ]));
        }
        if (empty($data->name)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Name is required'
            ]));
        }
        if (empty($data->password)) {
            $query = "UPDATE user SET user_name = ?, name = ?, status = ?, date_updated = NOW() 
            where user_id = ?";
            $stmt = mysqli_prepare($conn, $query);
            mysqli_stmt_bind_param(
                $stmt,
                'sssi',
                $data->user_name,
                $data->name,
                $data->status,
                $_GET['user_id']
            );
            mysqli_stmt_execute($stmt);
            $error_message = mysqli_error($conn);

            if ($error_message) { //ใช้ในการ เช็ค error
                http_response_code(500);
                exit(json_encode([
                    'message' => $error_message
                ]));
            }
            exit(json_encode([
                'message' => 'แก้ไขสำเร็จ โดยไมเ่ปลี่ยน password'
            ]));
        }
        $query = "UPDATE user SET user_name = ?, name = ?, status = ?, password = ?, date_updated = NOW() 
            where user_id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'sssis',
            $data->user_name,
            $data->name,
            $data->status,
            $data->password,
            $_GET['user_id']
        );
        mysqli_stmt_execute($stmt);
        $error_message = mysqli_error($conn);

        if ($error_message) { //ใช้ในการ เช็ค error
            http_response_code(500);
            exit(json_encode([
                'message' => $error_message
            ]));
        }
        exit(json_encode([
            'message' => 'แก้ไขสำเร็จ โดยปลี่ยน password ด้วย'
        ]));
    }
}

http_response_code(400);
echo json_encode(['message' => 'The Request is Invalid']);
