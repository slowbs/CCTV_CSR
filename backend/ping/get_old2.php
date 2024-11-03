<?php

header("Refresh: 120;");

$sql = "SELECT * FROM cctv
left join floor on cctv.floor = floor.floor_id
 where 1";
$query = mysqli_query($conn, $sql);
// $result = mysqli_fetch_all($query, MYSQLI_ASSOC);


if ($query->num_rows > 0) {
    $nodes = array();
    $count_ping = array();
    $notify = array();
    $durable_no = array();
    $durable_name = array();
    $floor_name = array();
    $location = array();
    $monitor = array();
    $id = array();
    $type = array();
    $count_ping_online = 0;
    $count_ping_offline = 0;
    // output data of each row
    while ($row = $query->fetch_assoc()) {
        if (!empty($row["ip"])) {
            $ip = $row["ip"];
            $nodes[] .= $ip;
            $count_ping[] .= $row["count_ping"];
            $notify[] .= $row["notify"];
            $durable_no[] .= $row["durable_no"];
            $type[] .= $row["type"];
            $floor_name[] .= $row["floor_name"];
            $location[] .= $row["location"];
            $monitor[] .= $row["monitor"];
            $id[] .= $row["id"];
            $durable_name[] .= $row["durable_name"];
        }
    }
    $node_count = count($nodes);

    $curl_arr = array();
    $master = curl_multi_init();
    for ($i = 0; $i < $node_count; $i++) {
        $url = $nodes[$i];
        $curl_arr[$i] = curl_init($url);
        // curl_setopt($curl_arr[$i], CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl_arr[$i], CURLOPT_NOBODY, true);
        curl_setopt($curl_arr[$i], CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($curl_arr[$i], CURLOPT_TIMEOUT, 2);
        curl_multi_add_handle($master, $curl_arr[$i]);
    }

    do {
        curl_multi_exec($master, $running);
    } while ($running > 0);

    // print_r($nodes);
    // print_r($count_ping);
    // print_r($notify);
    for ($i = 0; $i < $node_count; $i++) {
        // $results[] = curl_getinfo($curl_arr[$i], CURLINFO_HTTP_CODE);
        $status = curl_getinfo($curl_arr[$i], CURLINFO_HTTP_CODE);
        echo $durable_no[$i] . " " . $nodes[$i] . " ";
        if (200 == $status) {
            $count_ping_online += 1;
            if ($notify[$i] == 1) {
                if ($count_ping[$i] > 0) {
                    $count_ping[$i]--;
                    $query2 = "UPDATE cctv SET ping = '0', count_ping = ?, notify = '1' where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'ii',
                        $count_ping[$i],
                        $id[$i]
                    );
                } else {
                    $query2 = "UPDATE cctv SET ping = '0', count_ping = ?, notify = '0', ping_updated = NOW() where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'ii',
                        $count_ping[$i],
                        $id[$i]
                    );

                    // เก็บ Log กลับมาออนไลน์ใน db
                    $query3 = "INSERT INTO log_ping (cctv_id, type, ping_checked) VALUES (?, ?, '0')";
                    $stmt2 = mysqli_prepare($conn, $query3);
                    mysqli_stmt_bind_param(
                        $stmt2,
                        'ii',
                        $id[$i],
                        $type[$i]
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
                    $mymessage .= "หมายเลขครุภัณฑ์ : " . $durable_no[$i] . "\n";
                    $mymessage .= "รายการ : " . $durable_name[$i] . "\n";
                    $mymessage .= "อาคาร : " . $floor_name[$i] . "\n";
                    $mymessage .= "สถานที่ : " . $location[$i] . "\n";
                    $mymessage .= "Monitor : " . $monitor[$i] . "\n";
                    $mymessage .= "หมายเลข IP : " . $nodes[$i] . "\n";
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
                }
            } else {
                $query2 = "UPDATE cctv SET ping = '0', count_ping = ? where id = ?";
                $stmt = mysqli_prepare($conn, $query2);
                mysqli_stmt_bind_param(
                    $stmt,
                    'ii',
                    $count_ping[$i],
                    $id[$i]
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
            $count_ping_offline += 1;
            if ($notify[$i] == 0) {
                if ($count_ping[$i] < 5) {
                    $count_ping[$i]++;
                    $query2 = "UPDATE cctv SET ping = '1', count_ping = ? where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'ii',
                        $count_ping[$i],
                        $id[$i]
                    );
                } else {
                    $query2 = "UPDATE cctv SET ping = '1', notify = '1', ping_updated = NOW() where id = ?";
                    $stmt = mysqli_prepare($conn, $query2);
                    mysqli_stmt_bind_param(
                        $stmt,
                        'i',
                        $id[$i]
                    );

                    // เก็บ Log กล้องดับใน db
                    $query3 = "INSERT INTO log_ping (cctv_id, type, ping_checked) VALUES (?, ?, '1')";
                    $stmt2 = mysqli_prepare($conn, $query3);
                    mysqli_stmt_bind_param(
                        $stmt2,
                        'ii',
                        $id[$i],
                        $type[$i]
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
                    $mymessage .= "หมายเลขครุภัณฑ์ : " . $durable_no[$i] . "\n";
                    $mymessage .= "รายการ : " . $durable_name[$i] . "\n";
                    $mymessage .= "อาคาร : " . $floor_name[$i] . "\n";
                    $mymessage .= "สถานที่ : " . $location[$i] . "\n";
                    $mymessage .= "Monitor : " . $monitor[$i] . "\n";
                    $mymessage .= "หมายเลข IP : " . $nodes[$i] . "\n";
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
    // print_r($results);
    echo "Online = " . $count_ping_online . "\n";
    echo "Offline = " . $count_ping_offline . "\n";
} else {
    echo "0 results";
}
