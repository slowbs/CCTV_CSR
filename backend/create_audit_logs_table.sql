CREATE TABLE `cctv_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cctv_id` int(11) NOT NULL,
  `old_ip` varchar(255) DEFAULT NULL,
  `new_ip` varchar(255) DEFAULT NULL,
  `old_location` text DEFAULT NULL,
  `new_location` text DEFAULT NULL,
  `old_monitor` varchar(255) DEFAULT NULL,
  `new_monitor` varchar(255) DEFAULT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `old_floor` varchar(50) DEFAULT NULL,
  `new_floor` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
