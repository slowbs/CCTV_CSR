<?php

// header("Refresh: 10;");

$sql = "SELECT * FROM cctv WHERE '1'";
$query = mysqli_query($conn, $sql);
// $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

if ($query->num_rows > 0) {
    // output data of each row
    while ($row = $query->fetch_assoc()) {
        echo $row["id"] . " ";
        echo $row["durable_no"] . " ";
        echo $row["ip"] . " ";
        $ip = $row["ip"];
        exec("ping -n 1 $ip", $output, $status);
        // print_r($output);

        if ($status == 0) {
            $query2 = "UPDATE cctv SET ping = '0' where id = ?";
            $stmt = mysqli_prepare($conn, $query2);
            mysqli_stmt_bind_param(
                $stmt,
                'i',
                $row["id"]
            );
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
            $query2 = "UPDATE cctv SET ping = '1' where id = ?";
            $stmt = mysqli_prepare($conn, $query2);
            mysqli_stmt_bind_param(
                $stmt,
                'i',
                $row["id"]
            );
            mysqli_stmt_execute($stmt);
            $error_message = mysqli_error($conn);

            if ($error_message) { //ใช้ในการ เช็ค error
                http_response_code(500);
                exit(json_encode([
                    'message' => $error_message
                ]));
            }
            echo "Dead \n";
        }
    }
} else {
    echo "0 results";
}
