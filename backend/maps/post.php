<?php
// backend/maps/post.php

// Check if image is uploaded
$imageName = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    $targetDir = __DIR__ . '/../uploads/maps/';
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    
    $fileName = time() . '_' . basename($_FILES['image']['name']);
    $targetFilePath = $targetDir . $fileName;
    
    // Check file type
    $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);
    $allowTypes = array('jpg','png','jpeg','gif');
    
    if(in_array(strtolower($fileType), $allowTypes)){
        if(move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)){
            $imageName = $fileName;
        }
    }
}

// Get other data
$name = $_POST['name'] ?? 'Untitled Map';

$stmt = $conn->prepare("INSERT INTO cctv_maps (name, image) VALUES (?, ?)");
$stmt->bind_param("ss", $name, $imageName);

if ($stmt->execute()) {
    echo json_encode(['result' => true, 'message' => 'Map created successfully', 'id' => $stmt->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(['result' => false, 'message' => 'Error: ' . $stmt->error]);
}
?>
