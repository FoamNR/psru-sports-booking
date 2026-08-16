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

$admin_id = $_SESSION['user_id'];

// 1. Handle GET Requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Users
        $users_stmt = $pdo->prepare("SELECT id, username, first_name, last_name, email, phone, role, status FROM users WHERE id != ? ORDER BY id DESC");
        $users_stmt->execute([$admin_id]);
        $users = $users_stmt->fetchAll();
        
        // Courts
        $courts_stmt = $pdo->query("
            SELECT c.*, cam.name AS campus_name, ci.image_url 
            FROM courts c 
            JOIN campuses cam ON c.campus_id = cam.id
            LEFT JOIN court_images ci ON c.id = ci.court_id AND ci.is_primary = 1
            ORDER BY c.id DESC
        ");
        $courts = $courts_stmt->fetchAll();
        
        // Campuses
        $campuses = $pdo->query("SELECT * FROM campuses")->fetchAll();
        
        echo json_encode([
            'success' => true,
            'users' => $users,
            'courts' => $courts,
            'campuses' => $campuses
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}

// 2. Handle POST Actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    $action = $input['action'] ?? '';
    
    if ($action === 'create_user') {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $first_name = trim($input['first_name'] ?? '');
        $last_name = trim($input['last_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $role = trim($input['role'] ?? 'student');
        $status = trim($input['status'] ?? 'normal');
        
        if (empty($username) || empty($password) || empty($first_name) || empty($last_name) || empty($email) || empty($phone)) {
            echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลด่วนสำคัญให้ครบถ้วนทุกช่องครับ']);
            exit();
        }
        
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']);
            exit();
        }
        
        try {
            // Check duplicate
            $check = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $check->execute([$username]);
            if ($check->fetchColumn() > 0) {
                echo json_encode(['success' => false, 'message' => 'ชื่อผู้ใช้นี้มีในระบบแล้ว']);
                exit();
            }
            
            $pwd_hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("
                INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$username, $pwd_hash, $first_name, $last_name, $email, $phone, $role, $status]);
            echo json_encode(['success' => true, 'message' => 'เพิ่มผู้ใช้ใหม่สำเร็จ']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
    
    if ($action === 'edit_user') {
        $target_id = intval($input['target_id'] ?? 0);
        $first_name = trim($input['first_name'] ?? '');
        $last_name = trim($input['last_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $role = trim($input['role'] ?? 'student');
        $status = trim($input['status'] ?? 'normal');
        $new_password = trim($input['new_password'] ?? '');
        
        if ($target_id <= 0 || empty($first_name) || empty($last_name)) {
            echo json_encode(['success' => false, 'message' => 'กรุณากรอกชื่อจริงและนามสกุล']);
            exit();
        }
        
        try {
            if (!empty($new_password)) {
                if (strlen($new_password) < 6) {
                    echo json_encode(['success' => false, 'message' => 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร']);
                    exit();
                }
                $pwd_hash = password_hash($new_password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, status = ?, password_hash = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$first_name, $last_name, $email, $phone, $role, $status, $pwd_hash, $target_id]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, status = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$first_name, $last_name, $email, $phone, $role, $status, $target_id]);
            }
            echo json_encode(['success' => true, 'message' => 'แก้ไขบัญชีผู้ใช้สำเร็จ']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
    
    if ($action === 'toggle_status') {
        $target_id = intval($input['target_id'] ?? 0);
        
        if ($target_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid ID']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("SELECT status FROM users WHERE id = ?");
            $stmt->execute([$target_id]);
            $current_status = $stmt->fetchColumn();
            
            $new_status = ($current_status === 'normal') ? 'suspended' : 'normal';
            
            $update = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            $update->execute([$new_status, $target_id]);
            
            echo json_encode(['success' => true, 'message' => 'สลับสถานะผู้ใช้สำเร็จ', 'new_status' => $new_status]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
    
    if ($action === 'delete_user') {
        $target_id = intval($input['target_id'] ?? 0);
        
        if ($target_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid ID']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$target_id]);
            echo json_encode(['success' => true, 'message' => 'ลบผู้ใช้สำเร็จ']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
    
    if ($action === 'publish_news') {
        $title = trim($input['news_title'] ?? '');
        $content = trim($input['news_content'] ?? '');
        
        if (empty($title) || empty($content)) {
            echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลหัวข้อและเนื้อหาประกาศ']);
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO news (title, content, created_by) VALUES (?, ?, ?)");
            $stmt->execute([$title, $content, $admin_id]);
            echo json_encode(['success' => true, 'message' => 'อัพเดตประกาศและข่าวสารระบบเรียบร้อยแล้ว']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
    
    echo json_encode(['success' => false, 'message' => 'Invalid Action']);
    exit();
}
