<?php

session_start();

// header('Access-Control-Allow-Headers: Access-Control-Allow-Origin, Content-Type');
// header('Access-Control-Allow-Origin: *');
// header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");

// echo '<pre>';
// print_r($_SERVER);
// echo '</pre>';

require 'configs/head-fix.php';
require 'configs/defines.php';
require 'configs/routes.php';
require 'configs/database.php';

if(isset($routes[$route][$method]))
{
    require $routes[$route][$method];
}
else
{
    http_response_code(404);
            echo json_encode([
                'message' => 'ไม่เจอ Page นะจ้ะ'
            ], JSON_UNESCAPED_UNICODE);
}