<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Only students can create bookings.']);
    exit();
}

$user_id = $_SESSION['user_id'];

// Get POST params
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$court_id = intval($input['court_id'] ?? 0);
$booking_date = trim($input['booking_date'] ?? '');
$time_slot = trim($input['time_slot'] ?? ''); // e.g. "17:00-18:00"
$additional_request = trim($input['additional_request'] ?? '');

if ($court_id <= 0 || empty($booking_date) || empty($time_slot)) {
    echo json_encode(['success' => false, 'message' => 'กรุณาระบุข้อมูลสนาม วันที่ และเวลาจองให้ครบถ้วน']);
    exit();
}

// Split timeslot
$time_parts = explode('-', $time_slot);
if (count($time_parts) !== 2) {
    echo json_encode(['success' => false, 'message' => 'รูปแบบช่วงเวลาไม่ถูกต้อง']);
    exit();
}

$start_time = trim($time_parts[0]) . ':00';
$end_time = trim($time_parts[1]) . ':00';

try {
    // 1. Enforce student booking quota (1 booking / student / day)
    $quota_stmt = $pdo->prepare("
        SELECT COUNT(*) FROM bookings 
        WHERE user_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'completed')
    ");
    $quota_stmt->execute([$user_id, $booking_date]);
    $existing_count = $quota_stmt->fetchColumn();
    
    if ($existing_count > 0) {
        echo json_encode(['success' => false, 'message' => 'ขออภัย จำกัดสิทธิ์การจองสนามกีฬา 1 ครั้ง / วัน / คนเท่านั้นครับ']);
        exit();
    }
    
    // 2. Double check slot availability
    $check_stmt = $pdo->prepare("
        SELECT COUNT(*) FROM bookings 
        WHERE court_id = ? AND booking_date = ? AND start_time = ? AND status IN ('pending', 'approved', 'completed')
    ");
    $check_stmt->execute([$court_id, $booking_date, $start_time]);
    if ($check_stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'ขออภัย ช่วงเวลาดังกล่าวมีผู้ใช้งานอื่นจองสำเร็จไปก่อนหน้านี้แล้ว']);
        exit();
    }
    
    // 3. Insert new booking
    $booking_code = 'BK' . date('ymd') . rand(1000, 9999);
    $insert_stmt = $pdo->prepare("
        INSERT INTO bookings (booking_code, user_id, court_id, booking_date, start_time, end_time, status, additional_request) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    ");
    $insert_stmt->execute([
        $booking_code,
        $user_id,
        $court_id,
        $booking_date,
        $start_time,
        $end_time,
        $additional_request
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => "จองสนามสำเร็จแล้ว! รหัสคิวของคุณคือ $booking_code กรุณารอเจ้าหน้าที่ตรวจสอบอนุมัติ",
        'booking_code' => $booking_code
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกคำขอ: ' . $e->getMessage()]);
}
