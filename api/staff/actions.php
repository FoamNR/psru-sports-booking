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

$staff_id = $_SESSION['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$action = $input['action'] ?? '';

// 1. Process Booking Action (Approve / Reject)
if ($action === 'booking_action') {
    $booking_id = intval($input['booking_id'] ?? 0);
    $action_type = $input['action_type'] ?? ''; // approve, reject
    $reason = trim($input['reason'] ?? '');
    
    if ($booking_id <= 0 || !in_array($action_type, ['approve', 'reject'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        exit();
    }
    
    $status = ($action_type === 'approve') ? 'approved' : 'rejected';
    
    try {
        $stmt = $pdo->prepare("
            UPDATE bookings 
            SET status = ?, approved_by = ?, rejection_reason = ? 
            WHERE id = ? AND status = 'pending'
        ");
        $stmt->execute([$status, $staff_id, $reason, $booking_id]);
        
        echo json_encode(['success' => true, 'message' => 'ดำเนินการบันทึกคำขอจองสำเร็จเรียบร้อยแล้ว']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

// 2. Update Court Status
if ($action === 'update_court_status') {
    $court_id = intval($input['court_id'] ?? 0);
    $court_status = $input['court_status'] ?? ''; // ready, maintenance, closed
    
    if ($court_id <= 0 || !in_array($court_status, ['ready', 'maintenance', 'closed'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE courts SET status = ? WHERE id = ?");
        $stmt->execute([$court_status, $court_id]);
        echo json_encode(['success' => true, 'message' => 'อัปเดตความพร้อมของสนามสำเร็จ']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

// 3. Submit Problem Report
if ($action === 'report_issue') {
    $court_id = intval($input['report_court_id'] ?? 0);
    $description = trim($input['report_description'] ?? '');
    
    if ($court_id <= 0 || empty($description)) {
        echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลและเลือกสนามที่ชำรุด']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO reports (staff_id, court_id, description, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([$staff_id, $court_id, $description]);
        echo json_encode(['success' => true, 'message' => 'ส่งรายงานเหตุชำรุด/งดใช้งานส่งผู้ดูแลระบบส่วนกลางสำเร็จ']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid Action']);
