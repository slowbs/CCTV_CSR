<?php

// $request = json_decode(file_get_contents('php://input'));
//             echo json_encode([
//                 'message' => 'สวัสดี World UPDATE', 
//                 'Put_data' => 'Text : ' . $request->comment,
//                 'log_id' => $_GET['log_id']
//             ], JSON_UNESCAPED_UNICODE);

$data = json_decode(file_get_contents('php://input'));

// print_r($data);
if (isset($_GET['log_id'])) {
    if (isset($data->log_id)) {
        if (empty($data->log_id)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Log_Id is required'
            ]));
        }
        $query = "UPDATE log_ping SET comment = ? where log_id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'si',
            $data->comment,
            $_GET['log_id']
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
            'message' => 'แก้ไข Comment Log สำเร็จ'
        ]));
    }
}

http_response_code(400);
echo json_encode(['message' => 'The Request is Invalid']);
