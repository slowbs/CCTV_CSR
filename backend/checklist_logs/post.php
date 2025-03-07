<?php
$data = json_decode(file_get_contents("php://input"));

if (empty($data->month) || empty($data->checkList)) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid input data."), JSON_UNESCAPED_UNICODE);
    exit;
}

// ลบข้อมูลเก่า
$sqlDelete = "DELETE FROM checklist_logs WHERE month = ?";
$stmtDelete = mysqli_prepare($conn, $sqlDelete);
mysqli_stmt_bind_param($stmtDelete, "s", $data->month);
mysqli_stmt_execute($stmtDelete);

// สร้าง query insert
$sqlInsert = "INSERT INTO checklist_logs (month, checklist_item_id, status, comment) VALUES ";
$values = [];
foreach ($data->checkList as $item) {
    $values[] = "('" . $data->month . "', '" . $item->checklist_item_id . "', '" . $item->status . "', '" . $item->comment . "')";
}
$sqlInsert .= implode(', ', $values);

if (mysqli_query($conn, $sqlInsert)) {
    http_response_code(201);
    echo json_encode(array("message" => "Log created."), JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to create log.", "error" => mysqli_error($conn)), JSON_UNESCAPED_UNICODE);
}
