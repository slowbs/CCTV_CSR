<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include __DIR__ . '/configs/database.php';

// 1. Create cctv_maps table
$sql_create_table = "CREATE TABLE IF NOT EXISTS `cctv_maps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;";

if ($conn->query($sql_create_table) === TRUE) {
    echo "Table 'cctv_maps' created successfully.\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

// 2. Add columns to cctv table
$columns_to_add = [
    "map_id" => "int(11) DEFAULT NULL",
    "map_x" => "varchar(50) DEFAULT NULL",
    "map_y" => "varchar(50) DEFAULT NULL"
];

foreach ($columns_to_add as $column => $definition) {
    // Check if column exists
    $check_col = $conn->query("SHOW COLUMNS FROM `cctv` LIKE '$column'");
    if ($check_col->num_rows == 0) {
        $sql_alter = "ALTER TABLE `cctv` ADD COLUMN `$column` $definition";
        if ($conn->query($sql_alter) === TRUE) {
            echo "Column '$column' added to 'cctv' table.\n";
        } else {
            echo "Error adding column '$column': " . $conn->error . "\n";
        }
    } else {
        echo "Column '$column' already exists in 'cctv' table.\n";
    }
}

$conn->close();
?>
