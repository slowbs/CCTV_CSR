<?php

$request = json_decode(file_get_contents('php://input'));
            echo json_encode([
                'message' => 'สวัสดี World UPDATE', 
                'Put_data' => 'Text : ' . $request->message,
                'id' => $_GET['id']
            ], JSON_UNESCAPED_UNICODE);