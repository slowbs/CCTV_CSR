<?php

header("Refresh: 60;");

$sql = "SELECT * FROM cctv
left join floor on cctv.floor = floor.floor_id
 where 1";
$query = mysqli_query($conn, $sql);
// $result = mysqli_fetch_all($query, MYSQLI_ASSOC);


if ($query->num_rows > 0) {
    // output data of each row
    while ($row = $query->fetch_assoc()) {
        if (!empty($row["ip"])) {

            $count_ping = $row["count_ping"];
            $notify = $row["notify"];
            echo $row["id"] . " ";
            echo $row["durable_no"] . " ";
            echo $row["ip"] . " ";
            $ip = $row["ip"];
            // exec("ping -n 1 $ip", $output, $status); ไม่กำหนด wait time 
            exec("ping -n 1 -w 1 $ip", $output, $status);
            // print_r($output);

            if ($status == 0) {
                $count_ping = '0';
                if ($notify == 1) {
                    $query2 = "UPDATE cctv SET ping = '0', count_ping = ?, notify = '0' where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'ii',
                        $count_ping,
                        $row["id"]
                    );

                    // เก็บ Log กลับมาออนไลน์ใน db
                    $query3 = "INSERT INTO log_ping (cctv_id, ping_checked) VALUES (?, '0')";
                    $stmt2 = mysqli_prepare($conn, $query3);
                    mysqli_stmt_bind_param(
                        $stmt2,
                        'i',
                        $row["id"]
                    );
                    mysqli_stmt_execute($stmt2);
                    $error_message = mysqli_error($conn);

                    if ($error_message) { //ใช้ในการ เช็ค error
                        http_response_code(500);
                        exit(json_encode([
                            'message' => $error_message
                        ]));
                    }

                    echo json_encode([
                        'message' => 'เพิ่ม Log กล้องกลับมาออนไลน์สำเร็จ'
                    ], JSON_UNESCAPED_UNICODE);

                    // แจ้งเตือนกล้องกลับมาออนไลน์ผ่านไลน์
                    $token = "2o8uKi8xrEoTYDmGHuEW6W2j7oxY8bheDApgfYRUJo4"; // LINE Token test
                    //Message
                    $mymessage = "กล้องกลับมาออนไลน์ " . "\n"; //Set new line with '\n'
                    $mymessage .= "หมายเลขครุภัณฑ์ : " . $row["durable_no"] . "\n";
                    $mymessage .= "รายการ : " . $row["durable_name"] . "\n";
                    $mymessage .= "อาคาร : " . $row["floor_name"] . "\n";
                    $mymessage .= "สถานที่ : " . $row["location"] . "\n";
                    $mymessage .= "Monitor : " . $row["monitor"] . "\n";
                    $mymessage .= "หมายเลข IP : " . $row["ip"] . "\n";
                    $mymessage .= "สถานะ : ออนไลน์" . "\n";

                    $data = array(
                        'message' => $mymessage,
                    );
                    $chOne = curl_init();
                    curl_setopt($chOne, CURLOPT_URL, "https://notify-api.line.me/api/notify");
                    curl_setopt($chOne, CURLOPT_SSL_VERIFYHOST, 0);
                    curl_setopt($chOne, CURLOPT_SSL_VERIFYPEER, 0);
                    curl_setopt($chOne, CURLOPT_POST, 1);
                    curl_setopt($chOne, CURLOPT_POSTFIELDS, $data);
                    curl_setopt($chOne, CURLOPT_FOLLOWLOCATION, 1);
                    $headers = array('Method: POST', 'Content-type: multipart/form-data', 'Authorization: Bearer ' . $token,);
                    curl_setopt($chOne, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($chOne, CURLOPT_RETURNTRANSFER, 1);
                    $result = curl_exec($chOne);
                    //Check error
                    if (curl_error($chOne)) {
                        echo 'error:' . curl_error($chOne);
                    } else {
                        $result_ = json_decode($result, true);
                        echo "status : " . $result_['status'];
                        echo "message : " . $result_['message'];
                    }
                    //Close connection
                    curl_close($chOne);
                } else {
                    $query2 = "UPDATE cctv SET ping = '0', count_ping = ? where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'ii',
                        $count_ping,
                        $row["id"]
                    );
                }
                mysqli_stmt_execute($stmt);
                $error_message = mysqli_error($conn);

                if ($error_message) { //ใช้ในการ เช็ค error
                    http_response_code(500);
                    exit(json_encode([
                        'message' => $error_message
                    ]));
                }

                // echo (json_encode([
                //     'message' => 'แก้ไขสำเร็จ'
                // ]));

                echo "Online \n";
            } else {
                if ($notify == 0) {
                    if ($count_ping < 5) {
                        $count_ping++;
                        $query2 = "UPDATE cctv SET ping = '1', count_ping = ? where id = ?";
                        $stmt = mysqli_prepare($conn, $query2);
                        mysqli_stmt_bind_param(
                            $stmt,
                            'ii',
                            $count_ping,
                            $row["id"]
                        );
                    } else {
                        $query2 = "UPDATE cctv SET ping = '1', notify = '1' where id = ?";
                        $stmt = mysqli_prepare($conn, $query2);
                        mysqli_stmt_bind_param(
                            $stmt,
                            'i',
                            $row["id"]
                        );

                        // เก็บ Log กล้องดับใน db
                        $query3 = "INSERT INTO log_ping (cctv_id, ping_checked) VALUES (?, '1')";
                        $stmt2 = mysqli_prepare($conn, $query3);
                        mysqli_stmt_bind_param(
                            $stmt2,
                            'i',
                            $row["id"]
                        );
                        mysqli_stmt_execute($stmt2);
                        $error_message = mysqli_error($conn);

                        if ($error_message) { //ใช้ในการ เช็ค error
                            http_response_code(500);
                            exit(json_encode([
                                'message' => $error_message
                            ]));
                        }

                        echo json_encode([
                            'message' => 'เพิ่ม Log กล้องดับสำเร็จ'
                        ], JSON_UNESCAPED_UNICODE);

                        // แจ้งเตือนกล้องดับผ่านไลน์
                        $token = "2o8uKi8xrEoTYDmGHuEW6W2j7oxY8bheDApgfYRUJo4"; // LINE Token test
                        //Message
                        $mymessage = "กล้องดับ " . "\n"; //Set new line with '\n'
                        $mymessage .= "หมายเลขครุภัณฑ์ : " . $row["durable_no"] . "\n";
                        $mymessage .= "รายการ : " . $row["durable_name"] . "\n";
                        $mymessage .= "อาคาร : " . $row["floor_name"] . "\n";
                        $mymessage .= "สถานที่ : " . $row["location"] . "\n";
                        $mymessage .= "Monitor : " . $row["monitor"] . "\n";
                        $mymessage .= "หมายเลข IP : " . $row["ip"] . "\n";
                        $mymessage .= "สถานะ : ออฟไลน์" . "\n";

                        $data = array(
                            'message' => $mymessage,
                        );
                        $chOne = curl_init();
                        curl_setopt($chOne, CURLOPT_URL, "https://notify-api.line.me/api/notify");
                        curl_setopt($chOne, CURLOPT_SSL_VERIFYHOST, 0);
                        curl_setopt($chOne, CURLOPT_SSL_VERIFYPEER, 0);
                        curl_setopt($chOne, CURLOPT_POST, 1);
                        curl_setopt($chOne, CURLOPT_POSTFIELDS, $data);
                        curl_setopt($chOne, CURLOPT_FOLLOWLOCATION, 1);
                        $headers = array('Method: POST', 'Content-type: multipart/form-data', 'Authorization: Bearer ' . $token,);
                        curl_setopt($chOne, CURLOPT_HTTPHEADER, $headers);
                        curl_setopt($chOne, CURLOPT_RETURNTRANSFER, 1);
                        $result = curl_exec($chOne);
                        //Check error
                        if (curl_error($chOne)) {
                            echo 'error:' . curl_error($chOne);
                        } else {
                            $result_ = json_decode($result, true);
                            echo "status : " . $result_['status'];
                            echo "message : " . $result_['message'];
                        }
                        //Close connection
                        curl_close($chOne);
                    }
                    mysqli_stmt_execute($stmt);
                    $error_message = mysqli_error($conn);

                    if ($error_message) { //ใช้ในการ เช็ค error
                        http_response_code(500);
                        exit(json_encode([
                            'message' => $error_message
                        ]));
                    }
                }
                echo "Dead \n";
            }
        }
    }
} else {
    echo "0 results";
}
