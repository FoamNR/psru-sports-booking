<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

$court_id = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;
$selected_date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if ($court_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid Court ID']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT start_time, end_time 
        FROM bookings 
        WHERE court_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'completed')
    ");
    $stmt->execute([$court_id, $selected_date]);
    $booked_slots = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'booked_slots' => $booked_slots
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
