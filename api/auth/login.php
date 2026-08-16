<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

// Support both JSON POST and Form POST
$username = '';
$password = '';

if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');
} else {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
}

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง']);
        exit();
    }
    
    if ($user['status'] === 'suspended') {
        echo json_encode(['success' => false, 'message' => 'สิทธิ์การใช้งานของคุณถูกระงับชั่วคราว กรุณาติดต่อผู้ดูแลระบบ']);
        exit();
    }
    
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['role'] = $user['role'];
    
    echo json_encode(['success' => true, 'role' => $user['role']]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดในระบบ: ' . $e->getMessage()]);
}
