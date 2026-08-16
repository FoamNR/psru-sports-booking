<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit();
}

// Support JSON as well
$username = '';
$password = '';
$confirm_password = '';
$first_name = '';
$last_name = '';
$email = '';
$phone = '';
$role = 'student';

if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');
    $confirm_password = trim($input['confirm_password'] ?? '');
    $first_name = trim($input['first_name'] ?? '');
    $last_name = trim($input['last_name'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $role = trim($input['role'] ?? 'student');
} else {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $confirm_password = trim($_POST['confirm_password'] ?? '');
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $role = trim($_POST['role'] ?? 'student');
}

if (empty($username) || empty($password) || empty($confirm_password) || empty($first_name) || empty($last_name) || empty($email) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลด่วนสำคัญให้ครบถ้วนทุกช่องครับ']);
    exit();
}

if ($password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไปเพื่อความปลอดภัย']);
    exit();
}

if (!in_array($role, ['student', 'staff'])) {
    echo json_encode(['success' => false, 'message' => 'บทบาทผู้ใช้ระบบไม่ถูกต้อง']);
    exit();
}

try {
    // Check duplicate username
    $check_stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $check_stmt->execute([$username]);
    if ($check_stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'รหัสนักศึกษา/ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่นหรือติดต่อผู้ดูแล']);
        exit();
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $status = ($role === 'staff') ? 'suspended' : 'normal';
    
    $insert_stmt = $pdo->prepare("
        INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insert_stmt->execute([
        $username,
        $password_hash,
        $first_name,
        $last_name,
        $email,
        $phone,
        $role,
        $status
    ]);
    
    $msg = ($role === 'staff') ? 'ลงทะเบียนเจ้าหน้าที่สำเร็จ! กรุณารอแอดมินอนุมัติ' : 'สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้ทันที';
    echo json_encode(['success' => true, 'message' => $msg]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดทางเทคนิค: ' . $e->getMessage()]);
}
