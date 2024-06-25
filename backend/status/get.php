<?php

// $sql = "SELECT * FROM status WHERE '1'";
// $query = mysqli_query($conn9, $sql);
// $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

// echo json_encode([
//     'message' => 'test ทดสอบ',
//     'result' => $result
// ], JSON_UNESCAPED_UNICODE);

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
// $query = mysqli_query($conn9, $sql);
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

// $count_ping_online = 0;
// $count_ping_offline = 0;


// for ($i = 101; $i < 227; $i++) {
//     $url = '172.16.0.' . $i;
//     echo $url;
//     $ch = curl_init($url);
//     // $timeout = '0';
//     curl_setopt($ch, CURLOPT_NOBODY, true);
//     curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
//     // curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
//     curl_setopt($ch, CURLOPT_TIMEOUT_MS, 100);
//     curl_exec($ch);
//     $retcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//     curl_close($ch);
//     if (200 == $retcode) {
//         // All's well
//         echo "yes \n";
//         $count_ping_online += 1;
//     } else {
//         // not so much
//         echo "no \n";
//         $count_ping_offline += 1;
//     }
// }

// echo "Online = " . $count_ping_online . "\n";
// echo "Offline = " . $count_ping_offline . "\n";
?>

<?php
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
    $count_ping_online = 0;
    $count_ping_offline = 0;
    // output data of each row
    while ($row = $query->fetch_assoc()) {
        if (!empty($row["ip"])) {

            // $count_ping = $row["count_ping"];
            // $notify = $row["notify"];
            // echo $row["id"] . " ";
            // echo $row["durable_no"] . " ";
            // echo $row["ip"] . " \n";
            $ip = $row["ip"];
            $nodes[] .= $ip;
            $count_ping[] .= $row["count_ping"];
            $notify[] .= $row["notify"];
            $durable_no[] .= $row["durable_no"];
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
        echo $durable_no[$i] . " " . $nodes[$i] . " " . $status . " \n";
    }
    // print_r($results);
    echo "Online = " . $count_ping_online . "\n";
    echo "Offline = " . $count_ping_offline . "\n";
} else {
    echo "0 results";
}

?>
