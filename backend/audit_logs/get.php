<?php

$id = isset($_GET['id']) ? $_GET['id'] : null;

$query = "SELECT l.*, c.durable_name, c.durable_no, 
          COALESCE(f1.floor_name, l.old_floor) as old_floor,
          COALESCE(f2.floor_name, l.new_floor) as new_floor
          FROM cctv_audit_logs l 
          LEFT JOIN cctv c ON l.cctv_id = c.id 
          LEFT JOIN floor f1 ON l.old_floor = f1.floor_id
          LEFT JOIN floor f2 ON l.new_floor = f2.floor_id";

if ($id) {
    $query .= " WHERE l.cctv_id = ? ORDER BY l.id DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'i', $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $query .= " ORDER BY l.id DESC LIMIT 100";
    $result = mysqli_query($conn, $query);
}

$logs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $logs[] = $row;
}

echo json_encode(['result' => $logs], JSON_UNESCAPED_UNICODE);
