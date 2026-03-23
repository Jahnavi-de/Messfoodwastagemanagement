<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include __DIR__ . "/db.php";
$data = json_decode(file_get_contents("php://input"),true);

if (!$data) {
    echo json_encode(["error" => "No data received"]);
    exit();
}
$username = $data["username"];
$email = $data["email"];
$password = $data["password"];

$stmt = $conn->prepare("SELECT id FROM users WHERE email=?");
$stmt->bind_param("s",  $email);
$stmt->execute();
$result=$stmt->get_result();

if($result->num_rows>0){
    echo json_encode(["status"=>"email_exists"]);
    exit();
}

$hashedPassword=password_hash($password,PASSWORD_DEFAULT);

$stmt=$conn->prepare("INSERT INTO users (username,email,password) VALUES (?,?,?)");
$stmt->bind_param("sss",$username,$email,$hashedPassword);

if($stmt->execute()){
    echo json_encode(["status"=>"success"]);
}
else
{
    echo json_encode(["status"=>"error"]);
}

$stmt->close();
$conn->close();
?>