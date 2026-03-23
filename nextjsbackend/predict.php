<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
error_reporting(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No data received"
    ]);
    exit;
}

$modelApiUrl = getenv('WASTE_MODEL_API_URL');
if (!$modelApiUrl) {
    $modelApiUrl = 'http://127.0.0.1:5000/predict';
}

$requestBody = json_encode($data);
if ($requestBody === false) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Could not encode request payload"
    ]);
    exit;
}

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $requestBody,
        'timeout' => 30,
        'ignore_errors' => true,
    ],
]);

$result = @file_get_contents($modelApiUrl, false, $context);
$statusCode = 500;

if (isset($http_response_header[0]) && preg_match('{HTTP/\S+\s(\d{3})}', $http_response_header[0], $matches)) {
    $statusCode = (int)$matches[1];
}

if ($result === false) {
    http_response_code(502);
    echo json_encode([
        "success" => false,
        "message" => "Could not reach model API",
        "modelApiUrl" => $modelApiUrl
    ]);
    exit;
}

$decoded = json_decode($result, true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode([
        "success" => false,
        "message" => "Invalid response from model API"
    ]);
    exit;
}

http_response_code($statusCode);
echo json_encode($decoded);

exit;
?>

