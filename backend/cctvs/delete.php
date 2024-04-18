<?php

if (isset($_GET['id'])) {
    if (is_array($_GET['id'])) {
        $ids = $_GET['id'];
        //$in คือการกำหนดจำนวน ? ใน stmt ตามจำนวนของ array ID ที่ส่งมา
        $in = implode(',', array_fill(0, count($ids), '?'));
        $query = "DELETE from cctv where id IN ($in)";
        // echo json_encode([
        //     $ids,
        //     // $in,
        //     $query
        // ]);
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            str_repeat('i', count($ids)),
            ...$ids
        );
        mysqli_stmt_execute($stmt);

        //ใช้ในการ เช็ค error
        $error_message = mysqli_error($conn);
        if ($error_message) {
            http_response_code(500);
            exit(json_encode([
                'message' => $error_message
            ]));
        }
        
        exit(json_encode([
            'message' => 'ลบหลายรายการสำเร็จ'
        ]));
    } else {
        $query = "DELETE from cctv where id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'i',
            $_GET['id']
        );
        mysqli_stmt_execute($stmt);
        //ใช้ในการ เช็ค error

        $error_message = mysqli_error($conn);
        if ($error_message) {
            http_response_code(500);
            exit(json_encode([
                'message' => $error_message
            ]));
        }

        exit(json_encode([
            'message' => 'ลบรายการสำเร็จ'
        ]));
    }



    // echo json_encode([
    //     'message' => 'สวัสดี World DELETE',
    //     'Id' => $_GET['id']
    // ], JSON_UNESCAPED_UNICODE);


} else {
    http_response_code(400);
    echo json_encode([
        'message' => 'Request is อินเวลิด'
    ], JSON_UNESCAPED_UNICODE);
}

// echo json_encode([
//     'message' => 'สวัสดี World DELETE'
// ], JSON_UNESCAPED_UNICODE);
