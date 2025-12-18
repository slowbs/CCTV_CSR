<?php
// backend/maps/put.php - Update map name

$data = json_decode(file_get_contents('php://input'));

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit(json_encode(['result' => false, 'message' => 'Map ID is required']));
}

$id = $_GET['id'];

// Check if map exists
$checkStmt = $conn->prepare("SELECT id FROM cctv_maps WHERE id = ?");
$checkStmt->bind_param("i", $id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows == 0) {
    http_response_code(404);
    exit(json_encode(['result' => false, 'message' => 'Map not found']));
}

// Update map name
if (isset($data->name) && !empty($data->name)) {
    $stmt = $conn->prepare("UPDATE cctv_maps SET name = ? WHERE id = ?");
    $stmt->bind_param("si", $data->name, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['result' => true, 'message' => 'Map updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['result' => false, 'message' => 'Error: ' . $stmt->error]);
    }
} else {
    http_response_code(400);
    echo json_encode(['result' => false, 'message' => 'Map name is required']);
}
?>
