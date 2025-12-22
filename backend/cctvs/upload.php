<?php
// Upload image for a device (CCTV, Server, etc.)

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    exit(json_encode(['message' => 'No file uploaded or upload error']));
}

// Check if cctv_id is provided
if (!isset($_POST['cctv_id']) || empty($_POST['cctv_id'])) {
    http_response_code(400);
    exit(json_encode(['message' => 'cctv_id is required']));
}

$cctv_id = intval($_POST['cctv_id']);
$file = $_FILES['image'];

// Validate file type
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    exit(json_encode(['message' => 'Invalid file type. Allowed: jpg, png, gif, webp']));
}

// Validate file size (max 5MB)
$max_size = 5 * 1024 * 1024;
if ($file['size'] > $max_size) {
    http_response_code(400);
    exit(json_encode(['message' => 'File too large. Max 5MB']));
}

// Check if device exists and get old image path
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

// Delete old image if exists
$upload_dir = __DIR__ . '/../uploads/devices/';
if (!empty($device['image_path'])) {
    $old_file = $upload_dir . $device['image_path'];
    if (file_exists($old_file)) {
        unlink($old_file);
    }
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$new_filename = 'device_' . $cctv_id . '_' . time() . '.' . $extension;
$destination = $upload_dir . $new_filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    exit(json_encode(['message' => 'Failed to save file']));
}

// Update database with new image path
$update_query = "UPDATE cctv SET image_path = ? WHERE id = ?";
$update_stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($update_stmt, 'si', $new_filename, $cctv_id);
mysqli_stmt_execute($update_stmt);

if (mysqli_error($conn)) {
    // Rollback: delete the uploaded file
    unlink($destination);
    http_response_code(500);
    exit(json_encode(['message' => mysqli_error($conn)]));
}

echo json_encode([
    'message' => 'Image uploaded successfully',
    'image_path' => $new_filename
]);
