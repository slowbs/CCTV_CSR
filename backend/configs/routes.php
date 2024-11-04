<?php
//ข้อมูลกล้อง
$routes['/api/cctvs']['GET'] = 'cctvs/get.php';
$routes['/api/cctvs']['POST'] = 'cctvs/post.php';
$routes['/api/cctvs']['PUT'] = 'cctvs/put.php';
$routes['/api/cctvs']['DELETE'] = 'cctvs/delete.php';

//ข้อมูลสถานะกล้อง
$routes['/api/status']['GET'] = 'status/get.php';
$routes['/api/status']['POST'] = 'status/post.php';
$routes['/api/status']['PUT'] = 'status/put.php';
$routes['/api/status']['DELETE'] = 'status/delete.php';

//ข้อมูลการปิงสถานะกล้อง
$routes['/api/ping']['GET'] = 'ping/get.php';
$routes['/api/ping']['POST'] = 'ping/post.php';
$routes['/api/ping']['PUT'] = 'ping/put.php';
$routes['/api/ping']['DELETE'] = 'ping/delete.php';

//ข้อมูลการ Log การปิงสถานะกล้อง
$routes['/api/log_ping_cctv']['GET'] = 'log_ping_cctv/get.php';
$routes['/api/log_ping_cctv']['POST'] = 'log_ping_cctv/post.php';
$routes['/api/log_ping_cctv']['PUT'] = 'log_ping_cctv/put.php';
$routes['/api/log_ping_cctv']['DELETE'] = 'log_ping_cctv/delete.php';

//ข้อมูลอุปกรณ์ Network
$routes['/api/networks']['GET'] = 'networks/get.php';
$routes['/api/networks']['POST'] = 'networks/post.php';
$routes['/api/networks']['PUT'] = 'networks/put.php';
$routes['/api/networks']['DELETE'] = 'networks/delete.php';

//ข้อมูลชั้นอาคาร
$routes['/api/floors']['GET'] = 'floors/get.php';
$routes['/api/floors']['POST'] = 'floors/post.php';
$routes['/api/floors']['PUT'] = 'floors/put.php';
$routes['/api/floors']['DELETE'] = 'floors/delete.php';

//ข้อมูลประเภทครุภัณฑ์
$routes['/api/types']['GET'] = 'types/get.php';
$routes['/api/types']['POST'] = 'types/post.php';
$routes['/api/types']['PUT'] = 'types/put.php';
$routes['/api/types']['DELETE'] = 'types/delete.php';

//ข้อมูลผู้ใช้งาน
$routes['/api/users']['GET'] = 'users/get.php';
$routes['/api/users']['POST'] = 'users/post.php';
$routes['/api/users']['PUT'] = 'users/put.php';
$routes['/api/users']['DELETE'] = 'users/delete.php';

// Login
$routes['/api/login']['POST'] = 'login/login.php';
$routes['/api/logout']['POST'] = 'login/logout.php';
$routes['/api/login']['GET'] = 'login/profile.php';
