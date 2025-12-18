<?php
// backend/maps/reorder.php - Swap sort_order between two maps

$data = json_decode(file_get_contents('php://input'));

if (!isset($data->map_id) || !isset($data->direction)) {
    http_response_code(400);
    exit(json_encode(['result' => false, 'message' => 'map_id and direction are required']));
}

$mapId = $data->map_id;
$direction = $data->direction; // 'up' or 'down'

// Get current map info
$currentStmt = $conn->prepare("SELECT id, sort_order FROM cctv_maps WHERE id = ?");
$currentStmt->bind_param("i", $mapId);
$currentStmt->execute();
$currentResult = $currentStmt->get_result();

if ($currentResult->num_rows == 0) {
    http_response_code(404);
    exit(json_encode(['result' => false, 'message' => 'Map not found']));
}

$currentMap = $currentResult->fetch_assoc();
$currentOrder = $currentMap['sort_order'];

// Find adjacent map based on direction
if ($direction === 'up') {
    // Find the map with the highest sort_order that is less than current
    $adjacentStmt = $conn->prepare("SELECT id, sort_order FROM cctv_maps WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1");
} else {
    // Find the map with the lowest sort_order that is greater than current
    $adjacentStmt = $conn->prepare("SELECT id, sort_order FROM cctv_maps WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1");
}

$adjacentStmt->bind_param("i", $currentOrder);
$adjacentStmt->execute();
$adjacentResult = $adjacentStmt->get_result();

if ($adjacentResult->num_rows == 0) {
    // Already at the edge, nothing to swap
    exit(json_encode(['result' => true, 'message' => 'Already at the edge']));
}

$adjacentMap = $adjacentResult->fetch_assoc();
$adjacentId = $adjacentMap['id'];
$adjacentOrder = $adjacentMap['sort_order'];

// Swap sort_orders
$conn->begin_transaction();

try {
    $updateCurrent = $conn->prepare("UPDATE cctv_maps SET sort_order = ? WHERE id = ?");
    $updateCurrent->bind_param("ii", $adjacentOrder, $mapId);
    $updateCurrent->execute();

    $updateAdjacent = $conn->prepare("UPDATE cctv_maps SET sort_order = ? WHERE id = ?");
    $updateAdjacent->bind_param("ii", $currentOrder, $adjacentId);
    $updateAdjacent->execute();

    $conn->commit();
    echo json_encode(['result' => true, 'message' => 'Order updated successfully']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['result' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
