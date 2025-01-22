<?php
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!empty($id)) {

        $sql = "SELECT log_id, cctv_id, ping_checked, log_ping.date_created as date_created, cctv.durable_no as durable_no,
    cctv.durable_name as durable_name, floor_name, location, cctv.monitor as monitor, cctv.ip as ip
    FROM `log_ping`
    left join cctv on cctv.id = log_ping.cctv_id
    left join floor on cctv.floor = floor.floor_id
    where log_ping.type = $id ORDER BY date_created DESC";
        $query = mysqli_query($conn, $sql);
        $result = mysqli_fetch_all($query, MYSQLI_ASSOC);

        echo json_encode([
            'message' => 'test ทดสอบ',
            'result' => $result
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(
            [
                'message' => 'Parameter is NOT VALID'
            ],
            JSON_UNESCAPED_UNICODE
        );
    }
} else {
    echo json_encode(
        [
            'message' => 'Parameter is Requested'
        ],
        JSON_UNESCAPED_UNICODE
    );
}
