<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// 1. Delete Court Action
if ($action === 'delete_court') {
    $court_id = intval($_GET['court_id'] ?? $_POST['court_id'] ?? 0);
    if ($court_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Court ID']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM courts WHERE id = ?");
        $stmt->execute([$court_id]);
        echo json_encode(['success' => true, 'message' => 'ลบข้อมูลสนามกีฬาเรียบร้อยแล้ว']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'ไม่สามารถลบสนามนี้ได้เนื่องจากอาจมีประวัติการจองค้างอยู่: ' . $e->getMessage()]);
    }
    exit();
}

// 2. Create Court Action
if ($action === 'create_court') {
    $court_name = trim($_POST['court_name'] ?? '');
    $sport_type = $_POST['sport_type'] ?? '';
    $campus_id = intval($_POST['campus_id'] ?? 0);
    $location_type = $_POST['location_type'] ?? 'indoor';
    $description = trim($_POST['description'] ?? '');
    $opening_time = ($_POST['opening_time'] ?? '08:00') . ':00';
    $closing_time = ($_POST['closing_time'] ?? '20:00') . ':00';
    $max_booking_hours = intval($_POST['max_booking_hours'] ?? 2);
    $facilities = $_POST['facilities'] ?? [];
    
    if (empty($court_name) || empty($sport_type) || $campus_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน']);
        exit();
    }
    
    // File Upload handling
    $image_name = 'default_court.jpg';
    if (isset($_FILES['court_image']) && $_FILES['court_image']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['court_image']['tmp_name'];
        $file_original = $_FILES['court_image']['name'];
        $file_ext = strtolower(pathinfo($file_original, PATHINFO_EXTENSION));
        
        $allowed = ['jpg', 'jpeg', 'png', 'gif'];
        if (in_array($file_ext, $allowed)) {
            $unique_name = uniqid('court_', true) . '.' . $file_ext;
            $dest = dirname(dirname(__DIR__)) . '/uploads/courts/' . $unique_name;
            if (move_uploaded_file($file_tmp, $dest)) {
                $image_name = $unique_name;
            }
        }
    }
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("
            INSERT INTO courts (campus_id, name, sport_type, description, location_type, status, opening_time, closing_time, max_booking_hours_per_day) 
            VALUES (?, ?, ?, ?, ?, 'ready', ?, ?, ?)
        ");
        $stmt->execute([$campus_id, $court_name, $sport_type, $description, $location_type, $opening_time, $closing_time, $max_booking_hours]);
        $court_id = $pdo->lastInsertId();
        
        if (count($facilities) > 0) {
            $fac_stmt = $pdo->prepare("INSERT INTO court_facilities (court_id, facility_name) VALUES (?, ?)");
            foreach ($facilities as $facility) {
                $fac_stmt->execute([$court_id, $facility]);
            }
        }
        
        $img_stmt = $pdo->prepare("INSERT INTO court_images (court_id, image_url, is_primary) VALUES (?, ?, 1)");
        $img_stmt->execute([$court_id, $image_name]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'เพิ่มสนามกีฬาแห่งใหม่สำเร็จเรียบร้อย!']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()]);
    }
    exit();
}

// 3. Update Court Action
if ($action === 'update_court') {
    $court_id = intval($_POST['court_id'] ?? 0);
    $court_name = trim($_POST['court_name'] ?? '');
    $sport_type = $_POST['sport_type'] ?? '';
    $campus_id = intval($_POST['campus_id'] ?? 0);
    $location_type = $_POST['location_type'] ?? 'indoor';
    $description = trim($_POST['description'] ?? '');
    $opening_time = ($_POST['opening_time'] ?? '08:00') . ':00';
    $closing_time = ($_POST['closing_time'] ?? '20:00') . ':00';
    $max_booking_hours = intval($_POST['max_booking_hours'] ?? 2);
    $facilities = $_POST['facilities'] ?? [];
    
    if ($court_id <= 0 || empty($court_name) || empty($sport_type) || $campus_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน']);
        exit();
    }
    
    $new_image_name = '';
    if (isset($_FILES['court_image']) && $_FILES['court_image']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['court_image']['tmp_name'];
        $file_original = $_FILES['court_image']['name'];
        $file_ext = strtolower(pathinfo($file_original, PATHINFO_EXTENSION));
        
        $allowed = ['jpg', 'jpeg', 'png', 'gif'];
        if (in_array($file_ext, $allowed)) {
            $unique_name = uniqid('court_', true) . '.' . $file_ext;
            $dest = dirname(dirname(__DIR__)) . '/uploads/courts/' . $unique_name;
            if (move_uploaded_file($file_tmp, $dest)) {
                $new_image_name = $unique_name;
            }
        }
    }
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("
            UPDATE courts 
            SET campus_id = ?, name = ?, sport_type = ?, description = ?, location_type = ?, opening_time = ?, closing_time = ?, max_booking_hours_per_day = ? 
            WHERE id = ?
        ");
        $stmt->execute([$campus_id, $court_name, $sport_type, $description, $location_type, $opening_time, $closing_time, $max_booking_hours, $court_id]);
        
        $delete_facs = $pdo->prepare("DELETE FROM court_facilities WHERE court_id = ?");
        $delete_facs->execute([$court_id]);
        
        if (count($facilities) > 0) {
            $insert_fac = $pdo->prepare("INSERT INTO court_facilities (court_id, facility_name) VALUES (?, ?)");
            foreach ($facilities as $facility) {
                $insert_fac->execute([$court_id, $facility]);
            }
        }
        
        if (!empty($new_image_name)) {
            $img_check = $pdo->prepare("SELECT COUNT(*) FROM court_images WHERE court_id = ? AND is_primary = 1");
            $img_check->execute([$court_id]);
            
            if ($img_check->fetchColumn() > 0) {
                $update_img = $pdo->prepare("UPDATE court_images SET image_url = ? WHERE court_id = ? AND is_primary = 1");
                $update_img->execute([$new_image_name, $court_id]);
            } else {
                $insert_img = $pdo->prepare("INSERT INTO court_images (court_id, image_url, is_primary) VALUES (?, ?, 1)");
                $insert_img->execute([$court_id, $new_image_name]);
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'อัปเดตข้อมูลรายละเอียดสนามกีฬาสำเร็จเรียบร้อย!']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()]);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid Action']);
