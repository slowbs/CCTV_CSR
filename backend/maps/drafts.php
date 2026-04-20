<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include __DIR__ . '/../configs/database.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['map_id'])) {
            $map_id = $_GET['map_id'];
            $stmt = $conn->prepare("SELECT * FROM cctv_drafts WHERE map_id = ?");
            $stmt->bind_param("i", $map_id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            echo json_encode(['result' => $result], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['message' => 'Map ID is required'], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        if (isset($data->map_id) && isset($data->x) && isset($data->y)) {
            $stmt = $conn->prepare("INSERT INTO cctv_drafts (map_id, x, y, rotation, note) VALUES (?, ?, ?, ?, ?)");
            $rotation = isset($data->rotation) ? $data->rotation : 0;
            $note = isset($data->note) ? $data->note : null;
            $stmt->bind_param("isdis", $data->map_id, $data->x, $data->y, $rotation, $note);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'เพิ่มจุดดราฟสำเร็จ', 'id' => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Error: ' . $stmt->error]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Incomplete data']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            // Dynamic update based on provided fields
            $fields = [];
            $types = "";
            $values = [];

            if (isset($data->x)) { $fields[] = "x = ?"; $types .= "s"; $values[] = $data->x; }
            if (isset($data->y)) { $fields[] = "y = ?"; $types .= "s"; $values[] = $data->y; }
            if (isset($data->rotation)) { $fields[] = "rotation = ?"; $types .= "i"; $values[] = $data->rotation; }
            if (isset($data->note)) { $fields[] = "note = ?"; $types .= "s"; $values[] = $data->note; }

            if (count($fields) > 0) {
                $sql = "UPDATE cctv_drafts SET " . implode(", ", $fields) . " WHERE id = ?";
                $types .= "i";
                $values[] = $id;

                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$values);
                
                if ($stmt->execute()) {
                    echo json_encode(['message' => 'อัปเดตจุดดราฟสำเร็จ']);
                } else {
                    http_response_code(500);
                    echo json_encode(['message' => 'Error: ' . $stmt->error]);
                }
            }
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $stmt = $conn->prepare("DELETE FROM cctv_drafts WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(['message' => 'ลบจุดดราฟสำเร็จ']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Error: ' . $stmt->error]);
            }
        }
        break;

    case 'OPTIONS':
        http_response_code(200);
        break;
}

$conn->close();
?>
