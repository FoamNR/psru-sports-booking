<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'staff') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    // 1. KPI Counts
    $pending_count = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'")->fetchColumn();
    $approved_today_count = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'approved' AND booking_date = CURDATE()")->fetchColumn();
    
    // Checked-in / Completed Rate
    $completed_count = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'")->fetchColumn();
    $total_today_count = $pdo->query("SELECT COUNT(*) FROM bookings WHERE booking_date = CURDATE()")->fetchColumn();
    $checkin_rate = ($total_today_count > 0) ? round(($completed_count / $total_today_count) * 100) : 85;
    
    // Most Popular Court
    $popular_stmt = $pdo->query("
        SELECT c.name, COUNT(b.id) AS count 
        FROM bookings b 
        JOIN courts c ON b.court_id = c.id 
        GROUP BY b.court_id 
        ORDER BY count DESC 
        LIMIT 1
    ");
    $popular = $popular_stmt->fetch();
    $popular_court_name = $popular ? $popular['name'] : 'ไม่มีข้อมูลการจอง';

    // 2. Pending Bookings List
    $pending_bookings_stmt = $pdo->query("
        SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN courts c ON b.court_id = c.id
        WHERE b.status = 'pending'
        ORDER BY b.id ASC
    ");
    $pending_bookings = $pending_bookings_stmt->fetchAll();

    // 3. Approved Bookings List
    $approved_bookings_stmt = $pdo->query("
        SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type, staff.first_name AS staff_first, staff.last_name AS staff_last
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN courts c ON b.court_id = c.id
        LEFT JOIN users staff ON b.approved_by = staff.id
        WHERE b.status = 'approved'
        ORDER BY b.booking_date DESC, b.start_time DESC
    ");
    $approved_bookings = $approved_bookings_stmt->fetchAll();

    // 4. Rejected Bookings List
    $rejected_bookings_stmt = $pdo->query("
        SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type, staff.first_name AS staff_first, staff.last_name AS staff_last
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN courts c ON b.court_id = c.id
        LEFT JOIN users staff ON b.approved_by = staff.id
        WHERE b.status = 'rejected'
        ORDER BY b.booking_date DESC, b.start_time DESC
    ");
    $rejected_bookings = $rejected_bookings_stmt->fetchAll();

    // 5. Courts List
    $courts_stmt = $pdo->query("SELECT * FROM courts ORDER BY id ASC");
    $db_courts = $courts_stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'kpis' => [
            'pending_count' => $pending_count,
            'approved_today_count' => $approved_today_count,
            'checkin_rate' => $checkin_rate,
            'popular_court_name' => $popular_court_name
        ],
        'pending_bookings' => $pending_bookings,
        'approved_bookings' => $approved_bookings,
        'rejected_bookings' => $rejected_bookings,
        'courts' => $db_courts
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
