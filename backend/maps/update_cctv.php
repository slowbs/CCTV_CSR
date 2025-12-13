<?php
// backend/maps/update_cctv.php

$data = json_decode(file_get_contents("php://input"), true);
$cctv_id = $data['cctv_id'] ?? null;
$map_id = $data['map_id'] ?? null; // Can be null to remove from map
$x = $data['x'] ?? null;
$y = $data['y'] ?? null;

if (!$cctv_id) {
    http_response_code(400);
    echo json_encode(['result' => false, 'message' => 'CCTV ID is required']);
    exit;
}

$stmt = $conn->prepare("UPDATE cctv SET map_id = ?, map_x = ?, map_y = ? WHERE id = ?");
$stmt->bind_param("issi", $map_id, $x, $y, $cctv_id);

if ($stmt->execute()) {
    echo json_encode(['result' => true, 'message' => 'CCTV position updated']);
} else {
    http_response_code(500);
    echo json_encode(['result' => false, 'message' => 'Error: ' . $stmt->error]);
}
?>
