<?php

// $request = json_decode(file_get_contents('php://input'));
//             echo json_encode([
//                 'message' => 'สวัสดี World UPDATE', 
//                 'Put_data' => 'Text : ' . $request->durable_no,
//                 'id' => $_GET['id']
//             ], JSON_UNESCAPED_UNICODE);

// Telegram Bot Configuration
define('TELEGRAM_BOT_TOKEN', '7725475514:AAESQ0vZWNyphDaa630sQaaLgvl7dMkCvuo');
define('TELEGRAM_CHAT_ID', '-5011497123');

/**
 * ส่งข้อความแจ้งเตือนไปยัง Telegram
 * @param string $message ข้อความที่ต้องการส่ง (รองรับ HTML)
 * @return bool สถานะการส่ง
 */
function sendTelegramMessage($message) {
    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";
    
    $postData = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode == 200;
}

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

        // Fetch old data for audit logging and Telegram notification
        $old_data_query = "SELECT c.ip, c.location, c.monitor, c.status, c.floor, c.type, c.maintenance_mode, 
                           c.durable_no, c.durable_name, IFNULL(f.floor_name, '') as floor_name 
                           FROM cctv c 
                           LEFT JOIN floor f ON c.floor = f.floor_id 
                           WHERE c.id = ?";
        $stmt_old = mysqli_prepare($conn, $old_data_query);
        mysqli_stmt_bind_param($stmt_old, 'i', $_GET['id']);
        mysqli_stmt_execute($stmt_old);
        $result_old = mysqli_stmt_get_result($stmt_old);
        $old_row = mysqli_fetch_assoc($result_old);

        // Prepare audit log data
        $old_ip = $old_row['ip'];
        $new_ip = $data->ip;
        $old_location = $old_row['location'];
        $new_location = $data->location;
        $old_monitor = $old_row['monitor'];
        $new_monitor = $data->monitor;
        $old_status = $old_row['status']; // Assuming status is stored as ID in cctv table, need to check if it matches input
        $new_status = $data->status_id;
        $old_floor = $old_row['floor']; // Assuming floor is stored as ID
        $new_floor = $data->floor_id;

        // Check for changes
        if ($old_ip != $new_ip || $old_location != $new_location || $old_monitor != $new_monitor || $old_status != $new_status || $old_floor != $new_floor) {
            $audit_query = "INSERT INTO cctv_audit_logs (cctv_id, old_ip, new_ip, old_location, new_location, old_monitor, new_monitor, old_status, new_status, old_floor, new_floor, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt_audit = mysqli_prepare($conn, $audit_query);
            mysqli_stmt_bind_param($stmt_audit, 'issssssssss', $_GET['id'], $old_ip, $new_ip, $old_location, $new_location, $old_monitor, $new_monitor, $old_status, $new_status, $old_floor, $new_floor);
            mysqli_stmt_execute($stmt_audit);
        }

        // Logic Maintenance Mode Log
        $maintenance_mode = isset($data->maintenance_mode) ? $data->maintenance_mode : 0;
        $old_maintenance_mode = $old_row['maintenance_mode'];
        
        if ($old_maintenance_mode != $maintenance_mode) {
             // mode 1 (Start MA) -> ping_checked = 2
             // mode 0 (End MA)   -> ping_checked = 3
             // mode only 0 or 1
             $ping_checked = ($maintenance_mode == 1) ? 2 : 3;
             $cctv_type = $old_row['type']; // Use type from old data

             $log_query = "INSERT INTO log_ping (cctv_id, type, ping_checked, date_created) VALUES (?, ?, ?, NOW())";
             $stmt_log = mysqli_prepare($conn, $log_query);
             mysqli_stmt_bind_param($stmt_log, 'iii', $_GET['id'], $cctv_type, $ping_checked);
             mysqli_stmt_execute($stmt_log);

             // ส่งแจ้งเตือน Telegram เมื่อเปิด/ปิด MA mode
             $ma_status = ($maintenance_mode == 1) ? 'เปิด Maintenance Mode 🔧' : 'ปิด Maintenance Mode ✅';
             $telegram_message = "<b>{$ma_status}</b>\n" .
                                 "หมายเลขครุภัณฑ์: <b>{$old_row['durable_no']}</b>\n" .
                                 "รายการ: {$old_row['durable_name']}\n" .
                                 "อาคาร: {$old_row['floor_name']}\n" .
                                 "สถานที่: {$old_row['location']}\n" .
                                 "Monitor: {$old_row['monitor']}\n" .
                                 "หมายเลข IP: {$old_row['ip']}";
             sendTelegramMessage($telegram_message);
        }


        $query = "UPDATE cctv SET durable_no = ?, durable_name = ?, location = ?, monitor = ?, brand = ?, model = ?, floor = ?, status = ?, 
        ip = ?, maintenance_mode = ?, date_updated = NOW() 
        where id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param(
            $stmt,
            'sssssssssii',
            $data->durable_no,
            $data->durable_name,
            $data->location,
            $data->monitor,
            $data->brand,
            $data->model,
            $data->floor_id,
            $data->status_id,
            $data->ip,
            $maintenance_mode,
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
