<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['user_id'];

// Get POST params
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}
$booking_id = intval($input['booking_id'] ?? 0);

if ($booking_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid Booking ID']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE bookings SET status = 'cancelled' 
        WHERE id = ? AND user_id = ? AND status = 'pending'
    ");
    $stmt->execute([$booking_id, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'ยกเลิกการจองสำเร็จ']);
    } else {
        echo json_encode(['success' => false, 'message' => 'ไม่สามารถยกเลิกได้ เนื่องจากอาจอยู่ในขั้นตอนอนุมัติแล้ว หรือไม่ใช่การจองของคุณ']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
