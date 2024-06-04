<?php

$sql = "SELECT * FROM status WHERE '1'";
$query = mysqli_query($conn, $sql);
$result = mysqli_fetch_all($query, MYSQLI_ASSOC);

echo json_encode([
    'message' => 'test ทดสอบ',
    'result' => $result
], JSON_UNESCAPED_UNICODE);

// echo json_encode(
//                     $result
// , JSON_UNESCAPED_UNICODE);

// $host="192.168.200.6";
// exec("ping -n 4 " . $host, $output, $status);
// print_r($output);

// $ip =   "192.168.200.7";
// $ip =   "172.16.0.216";
// exec("ping -n 1 -w 1 $ip", $output, $status);
// print_r($output);
// print_r($status);

// if ($status == 0)

// echo "Ping successful!";

// else

// echo "Ping unsuccessful!";

// $sql = "SELECT * FROM cctv WHERE '1'";
// $query = mysqli_query($conn, $sql);
// // $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

// if ($query->num_rows > 0) {
//     // output data of each row
//     while ($row = $query->fetch_assoc()) {
//         echo $row["durable_no"] . " ";
//         echo $row["ip"] . " ";
//         $ip = $row["ip"];
//         exec("ping -n 1 $ip", $output, $status);
//         // print_r($output);

//         if ($status == 0)

//         echo "Online \n";

//         else

//         echo "Dead \n";
//     }
// } else {
//     echo "0 results";
// }
