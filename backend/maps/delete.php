<?php
// backend/maps/delete.php
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['message' => 'ID is required']);
    exit;
}

// First, unlink/reset CCTV from this map
$conn->query("UPDATE cctv SET map_id = NULL, map_x = NULL, map_y = NULL WHERE map_id = $id");

// Get image to delete file
$query = $conn->query("SELECT image FROM cctv_maps WHERE id = $id");
$row = $query->fetch_assoc();
if ($row && $row['image']) {
    $filePath = __DIR__ . '/../uploads/maps/' . $row['image'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
}

// Delete map
$stmt = $conn->prepare("DELETE FROM cctv_maps WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(['result' => true, 'message' => 'Map deleted successfully']);
} else {
    http_response_code(500);
    echo json_encode(['result' => false, 'message' => 'Error: ' . $stmt->error]);
}
?>
