<?php
// backend/maps/get.php
$sql = "SELECT m.*, 
        (SELECT COUNT(*) FROM cctv c WHERE c.map_id = m.id AND c.type = '1') as cctv_count 
        FROM cctv_maps m 
        ORDER BY m.id ASC";

$query = mysqli_query($conn, $sql);
$result = [];

if ($query) {
    $result = mysqli_fetch_all($query, MYSQLI_ASSOC);
    
    // Add full URL to image path could be done here if needed
    foreach ($result as &$row) {
        if ($row['image']) {
            // Use rawurlencode to handle spaces and Thai characters correctly
            $row['image_url'] = 'http://' . $_SERVER['HTTP_HOST'] . '/CCTV_CSR/backend/uploads/maps/' . rawurlencode($row['image']);
        } else {
             $row['image_url'] = null;
        }
    }
}

echo json_encode(['result' => $result], JSON_UNESCAPED_UNICODE);
?>
