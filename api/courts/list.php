<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

try {
    $courts_stmt = $pdo->query("
        SELECT c.*, cam.name AS campus_name, cam.id AS campus_id_val, ci.image_url 
        FROM courts c 
        JOIN campuses cam ON c.campus_id = cam.id
        LEFT JOIN court_images ci ON c.id = ci.court_id AND ci.is_primary = 1
    ");
    $courts = $courts_stmt->fetchAll();
    
    // Fetch latest news too
    $news_stmt = $pdo->query("SELECT * FROM news ORDER BY created_at DESC LIMIT 1");
    $announcement = $news_stmt->fetch() ?: null;
    
    echo json_encode([
        'success' => true,
        'courts' => $courts,
        'announcement' => $announcement
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
