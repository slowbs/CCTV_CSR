<?php

$routes = [];
isset($_SERVER['PATH_INFO']) ? $route = $_SERVER['PATH_INFO'] : $route = '';
isset($_SERVER['REQUEST_METHOD']) ? $method = $_SERVER['REQUEST_METHOD'] : $method = '';
