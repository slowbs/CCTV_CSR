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

//ข้อมูลชั้นอาคาร
$routes['/api/floors']['GET'] = 'floors/get.php';
$routes['/api/floors']['POST'] = 'floors/post.php';
$routes['/api/floors']['PUT'] = 'floors/put.php';
$routes['/api/floors']['DELETE'] = 'floors/delete.php';

//ข้อมูลผู้ใช้งาน
$routes['/api/users']['GET'] = 'users/get.php';
$routes['/api/users']['POST'] = 'users/post.php';
$routes['/api/users']['PUT'] = 'users/put.php';
$routes['/api/users']['DELETE'] = 'users/delete.php';

// Login
$routes['/api/login']['POST'] = 'login/login.php';
$routes['/api/logout']['POST'] = 'login/logout.php';
$routes['/api/login']['GET'] = 'login/profile.php';