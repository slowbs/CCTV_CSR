<?php
require '../configs/database.php';

// Get some existing CCTV IDs
$query = "SELECT id FROM cctv LIMIT 5";
$result = mysqli_query($conn, $query);
$cctv_ids = [];
while ($row = mysqli_fetch_assoc($result)) {
    $cctv_ids[] = $row['id'];
}

if (empty($cctv_ids)) {
    die("No CCTV devices found. Please add some devices first.");
}

$actions = [
    ['old_ip' => '192.168.1.10', 'new_ip' => '192.168.1.20', 'type' => 'IP Change'],
    ['old_location' => 'Building A', 'new_location' => 'Building B', 'type' => 'Location Change'],
    ['old_status' => 'Active', 'new_status' => 'Maintenance', 'type' => 'Status Change'],
    ['old_monitor' => 'Monitor 1', 'new_monitor' => 'Monitor 2', 'type' => 'Monitor Change']
];

echo "Inserting mock data...<br>";

for ($i = 0; $i < 10; $i++) {
    $cctv_id = $cctv_ids[array_rand($cctv_ids)];
    $action = $actions[array_rand($actions)];
    
    $old_ip = $action['old_ip'] ?? null;
    $new_ip = $action['new_ip'] ?? null;
    $old_location = $action['old_location'] ?? null;
    $new_location = $action['new_location'] ?? null;
    $old_monitor = $action['old_monitor'] ?? null;
    $new_monitor = $action['new_monitor'] ?? null;
    $old_status = $action['old_status'] ?? null;
    $new_status = $action['new_status'] ?? null;
    
    // Random date within last 30 days
    $timestamp = time() - rand(0, 30 * 24 * 60 * 60);
    $updated_at = date('Y-m-d H:i:s', $timestamp);
    
    $sql = "INSERT INTO cctv_audit_logs 
            (cctv_id, old_ip, new_ip, old_location, new_location, old_monitor, new_monitor, old_status, new_status, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, 'isssssssss', 
        $cctv_id, $old_ip, $new_ip, $old_location, $new_location, 
        $old_monitor, $new_monitor, $old_status, $new_status, $updated_at
    );
    
    if (mysqli_stmt_execute($stmt)) {
        echo "Inserted log for CCTV ID $cctv_id at $updated_at<br>";
    } else {
        echo "Error: " . mysqli_error($conn) . "<br>";
    }
}

echo "Done!";
