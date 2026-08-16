<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

$court_id = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;

if ($court_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid Court ID']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT c.*, cam.name AS campus_name, ci.image_url 
        FROM courts c 
        JOIN campuses cam ON c.campus_id = cam.id 
        LEFT JOIN court_images ci ON c.id = ci.court_id AND ci.is_primary = 1
        WHERE c.id = ? LIMIT 1
    ");
    $stmt->execute([$court_id]);
    $court = $stmt->fetch();
    
    if (!$court) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Court Not Found']);
        exit();
    }
    
    // Fetch facilities
    $fac_stmt = $pdo->prepare("SELECT facility_name FROM court_facilities WHERE court_id = ?");
    $fac_stmt->execute([$court_id]);
    $facilities = $fac_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'court' => $court,
        'facilities' => $facilities
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
