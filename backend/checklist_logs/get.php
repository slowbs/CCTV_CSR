<?php

$month = isset($_GET['month']) ? $_GET['month'] : null;

if ($month) {
    $sql = "SELECT id, month, checklist_item_id, status, comment FROM checklist_logs WHERE month = ?";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $month);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $logs = mysqli_fetch_all($result, MYSQLI_ASSOC);

    http_response_code(200);
    echo json_encode($logs, JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Month is required."), JSON_UNESCAPED_UNICODE);
}
