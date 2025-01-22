<?php

// $request = json_decode(file_get_contents('php://input'));
//             echo json_encode([
//                 'message' => 'สวัสดี World UPDATE', 
//                 'Put_data' => 'Text : ' . $request->durable_no,
//                 'id' => $_GET['id']
//             ], JSON_UNESCAPED_UNICODE);

$data = json_decode(file_get_contents('php://input'));

if (isset($_GET['id'])) {
    // if (isset($data->durable_no) && isset($data->durable_name) && isset($data->location) && isset($data->brand) && isset($data->floor_id) && isset($data->status_id)) {
    if (isset($data->durable_no) && isset($data->durable_name) && isset($data->location) && isset($data->brand)) {
        if (empty($data->durable_no)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Durable number is required'
            ]));
        }
        if (empty($data->durable_name)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Durable name is required'
            ]));
        }
        if (empty($data->location)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Location is required'
            ]));
        }
        if (empty($data->brand)) {
            http_response_code(400);
            exit(json_encode([
                'message' => 'Brand is required'
            ]));
        }
        //ตัดออก เพื่อให้สามารถ Update ค่าเป็นแบบค่าว่างได้ 
        // if (empty($data->floor_id)) {
        //     http_response_code(400);
        //     exit(json_encode([
        //         'message' => 'Floor is required'
        //     ]));
        // }
        // if (empty($data->status_id)) {
        //     http_response_code(400);
        //     exit(json_encode([
        //         'message' => 'Status is required'
        //     ]));
        // }

        // $query = "INSERT INTO cctv (durable_no, durable_name, location, brand, floor, status) VALUES (?, ?, ?, ?, ?, ?)";
        $query = "UPDATE cctv SET durable_no = ?, durable_name = ?, location = ?, monitor = ?, brand = ?, model = ?, floor = ?, status = ?, 
        ip = ?, date_updated = NOW() 
        where id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'sssssssssi',
            $data->durable_no,
            $data->durable_name,
            $data->location,
            $data->monitor,
            $data->brand,
            $data->model,
            $data->floor_id,
            $data->status_id,
            $data->ip,
            $_GET['id']
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
            'message' => 'แก้ไขสำเร็จ'
        ]));
    }
}

http_response_code(400);
echo json_encode(['message' => 'The Request is Invalid']);
