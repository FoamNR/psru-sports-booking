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

try {
    $stmt = $pdo->prepare("
        SELECT b.*, c.name AS court_name, c.sport_type, cam.name AS campus_name 
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        JOIN campuses cam ON c.campus_id = cam.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC, b.start_time DESC
    ");
    $stmt->execute([$user_id]);
    $bookings = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
