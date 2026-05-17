<?php

$frontendUrl = env('APP_FRONTEND_URL', 'http://localhost:5173');
$extraOrigins = array_filter(explode(',', env('APP_EXTRA_ORIGINS', '')));

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_unique(array_merge(
        ['http://localhost:5173', 'http://localhost:3000'],
        [$frontendUrl],
        $extraOrigins
    )),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];