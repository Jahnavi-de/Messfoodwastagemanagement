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

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "No data received"
    ]);
    exit;
}

$date = $data['date'] ?? date("Y-m-d");
$dayOfWeek = $data['dayOfWeek'] ?? 'Monday';
$mealType = $data['mealType'] ?? 'lunch';
$studentsEnrolled = (int)($data['studentsEnrolled'] ?? 0);
$averageAttendance = (float)($data['averageAttendance'] ?? 0);
$specialEvent = $data['specialEvent'] ?? 'no';
$weather = $data['weather'] ?? 'clear';
$holidayPeriod = $data['holidayPeriod'] ?? 'no';
$menusServed = (int)($data['menusServed'] ?? 0);
$leftoverFromPreviousDay = (float)($data['leftoverFromPreviousDay'] ?? 0);
$menuItems = json_encode($data['menuItems'] ?? []);
$predictedWasteKg = (float)($data['predictedWasteKg'] ?? 0);
$cost = (float)($data['cost'] ?? 0);
$recommendation = $data['recommendation'] ?? 'Low';
$confidence = (float)($data['confidence'] ?? 0);

$recommendations = $data['recommendations'] ?? [];
$quantities = $recommendations['quantities'] ?? [];

$recommendedRiceKg = (float)($quantities['rice_kg'] ?? $data['recommendedRiceKg'] ?? 0);
$recommendedDalKg = (float)($quantities['dal_kg'] ?? $data['recommendedDalKg'] ?? 0);
$recommendedRotiCount = (int)($quantities['roti_count'] ?? $data['recommendedRotiCount'] ?? 0);
$recommendedVegKg = (float)($quantities['veg_kg'] ?? $data['recommendedVegKg'] ?? 0);
$recommendedNonvegKg = (float)($quantities['nonveg_kg'] ?? $data['recommendedNonvegKg'] ?? 0);
$currentWasteKg = (float)($recommendations['current_waste_kg'] ?? $data['currentWasteKg'] ?? 0);
$optimizedWasteKg = (float)($recommendations['optimized_waste_kg'] ?? $data['optimizedWasteKg'] ?? 0);
$wasteReductionKg = (float)($recommendations['waste_reduction_kg'] ?? $data['wasteReductionKg'] ?? 0);
$reductionPercent = (float)($recommendations['reduction_percent'] ?? $data['reductionPercent'] ?? 0);

$sql = "INSERT INTO waste_predictions (
    date,
    day_of_week,
    meal_type,
    students_enrolled,
    average_attendance,
    special_events,
    weather,
    holiday_period,
    number_of_menus,
    leftover_previous_day,
    predicted_waste,
    cost,
    recommendation,
    confidence,
    menu_items,
    recommended_rice_kg,
    recommended_dal_kg,
    recommended_roti_count,
    recommended_veg_kg,
    recommended_nonveg_kg,
    current_waste_kg,
    optimized_waste_kg,
    waste_reduction_kg,
    reduction_percent
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Could not prepare insert statement",
        "error" => $conn->error
    ]);
    exit;
}

$stmt->bind_param(
    "sssidsssidddsdsddidddddd",
    $date,
    $dayOfWeek,
    $mealType,
    $studentsEnrolled,
    $averageAttendance,
    $specialEvent,
    $weather,
    $holidayPeriod,
    $menusServed,
    $leftoverFromPreviousDay,
    $predictedWasteKg,
    $cost,
    $recommendation,
    $confidence,
    $menuItems,
    $recommendedRiceKg,
    $recommendedDalKg,
    $recommendedRotiCount,
    $recommendedVegKg,
    $recommendedNonvegKg,
    $currentWasteKg,
    $optimizedWasteKg,
    $wasteReductionKg,
    $reductionPercent
);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Could not save prediction entry",
        "error" => $stmt->error
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Prediction entry saved successfully",
    "id" => $stmt->insert_id
]);

$stmt->close();
$conn->close();
?>
