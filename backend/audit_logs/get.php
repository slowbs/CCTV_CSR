<?php

$id = isset($_GET['id']) ? $_GET['id'] : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = ($page - 1) * $limit;

// Base query for counting
$countQuery = "SELECT COUNT(*) as total FROM cctv_audit_logs l";
if ($id) {
    $countQuery .= " WHERE l.cctv_id = ?";
}

// Execute count query
$stmtCount = mysqli_prepare($conn, $countQuery);
if ($id) {
    mysqli_stmt_bind_param($stmtCount, 'i', $id);
}
mysqli_stmt_execute($stmtCount);
$countResult = mysqli_stmt_get_result($stmtCount);
$totalRow = mysqli_fetch_assoc($countResult);
$total = $totalRow['total'];

// Main query for data
$query = "SELECT l.*, c.durable_name, c.durable_no, 
          COALESCE(f1.floor_name, l.old_floor) as old_floor,
          COALESCE(f2.floor_name, l.new_floor) as new_floor,
          COALESCE(s1.status_name, l.old_status) as old_status,
          COALESCE(s2.status_name, l.new_status) as new_status
          FROM cctv_audit_logs l 
          LEFT JOIN cctv c ON l.cctv_id = c.id 
          LEFT JOIN floor f1 ON l.old_floor = f1.floor_id
          LEFT JOIN floor f2 ON l.new_floor = f2.floor_id
          LEFT JOIN status s1 ON l.old_status = s1.status_id
          LEFT JOIN status s2 ON l.new_status = s2.status_id";

if ($id) {
    $query .= " WHERE l.cctv_id = ? ORDER BY l.id DESC LIMIT ? OFFSET ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'iii', $id, $limit, $offset);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $query .= " ORDER BY l.id DESC LIMIT ? OFFSET ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, 'ii', $limit, $offset);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
}

$logs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $logs[] = $row;
}

echo json_encode([
    'result' => $logs,
    'total' => $total,
    'page' => $page,
    'limit' => $limit
], JSON_UNESCAPED_UNICODE);
