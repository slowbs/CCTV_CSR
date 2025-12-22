<?php
// Delete image for a device

$data = json_decode(file_get_contents('php://input'));

if (!isset($data->cctv_id) || empty($data->cctv_id)) {
    http_response_code(400);
    exit(json_encode(['message' => 'cctv_id is required']));
}

$cctv_id = intval($data->cctv_id);

// Get current image path
$query = "SELECT image_path FROM cctv WHERE id = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, 'i', $cctv_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$device = mysqli_fetch_assoc($result);

if (!$device) {
    http_response_code(404);
    exit(json_encode(['message' => 'Device not found']));
}

if (empty($device['image_path'])) {
    http_response_code(400);
    exit(json_encode(['message' => 'No image to delete']));
}

// Delete file from disk
$upload_dir = __DIR__ . '/../uploads/devices/';
$file_path = $upload_dir . $device['image_path'];
if (file_exists($file_path)) {
    unlink($file_path);
}

// Clear image_path in database
$update_query = "UPDATE cctv SET image_path = NULL WHERE id = ?";
$update_stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($update_stmt, 'i', $cctv_id);
mysqli_stmt_execute($update_stmt);

if (mysqli_error($conn)) {
    http_response_code(500);
    exit(json_encode(['message' => mysqli_error($conn)]));
}

echo json_encode(['message' => 'Image deleted successfully']);
