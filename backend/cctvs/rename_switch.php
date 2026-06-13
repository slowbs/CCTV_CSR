<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include __DIR__ . '/../configs/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['result' => false, 'message' => 'Method Not Allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (isset($data->old_name) && isset($data->new_name)) {
    $old_name = trim($data->old_name);
    $new_name = trim($data->new_name);

    if (empty($old_name)) {
        http_response_code(400);
        echo json_encode(['result' => false, 'message' => 'Old switch name cannot be empty']);
        exit();
    }

    // Begin transaction
    mysqli_begin_transaction($conn);

    try {
        // Update cctv table
        $stmt1 = $conn->prepare("UPDATE cctv SET switch_name = ? WHERE switch_name = ?");
        $stmt1->bind_param("ss", $new_name, $old_name);
        $stmt1->execute();
        $stmt1->close();

        // Update cctv_drafts table
        $stmt2 = $conn->prepare("UPDATE cctv_drafts SET switch_name = ? WHERE switch_name = ?");
        $stmt2->bind_param("ss", $new_name, $old_name);
        $stmt2->execute();
        $stmt2->close();

        mysqli_commit($conn);
        echo json_encode(['result' => true, 'message' => 'Rename successful']);
    } catch (Exception $e) {
        mysqli_rollback($conn);
        http_response_code(500);
        echo json_encode(['result' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['result' => false, 'message' => 'Incomplete data']);
}

$conn->close();
?>
