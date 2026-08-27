<?php

class AuthController extends BaseController {
    private $userModel;

    public function __construct() {
        $this->userModel = new UserModel();
    }

    /**
     * Handle user login
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'message' => 'Method Not Allowed'], 405);
        }

        $input = $this->getInput();
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            $this->json(['success' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน']);
        }

        try {
            $user = $this->userModel->getByUsername($username);
            
            if (!$user || !password_verify($password, $user['password_hash'])) {
                $this->json(['success' => false, 'message' => 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง']);
            }
            
            if ($user['status'] === 'suspended') {
                $this->json(['success' => false, 'message' => 'สิทธิ์การใช้งานของคุณถูกระงับชั่วคราว กรุณาติดต่อผู้ดูแลระบบ']);
            }
            
            $this->startSession();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['role'] = $user['role'];
            
            $this->json(['success' => true, 'role' => $user['role']]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในระบบ: ' . $e->getMessage()]);
        }
    }

    /**
     * Handle user registration
     */
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'message' => 'Method Not Allowed'], 405);
        }

        $input = $this->getInput();
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $confirm_password = trim($input['confirm_password'] ?? '');
        $first_name = trim($input['first_name'] ?? '');
        $last_name = trim($input['last_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $role = trim($input['role'] ?? 'student');

        if (empty($username) || empty($password) || empty($confirm_password) || empty($first_name) || empty($last_name) || empty($email) || empty($phone)) {
            $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลด่วนสำคัญให้ครบถ้วนทุกช่องครับ']);
        }

        if ($password !== $confirm_password) {
            $this->json(['success' => false, 'message' => 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง']);
        }

        if (strlen($password) < 6) {
            $this->json(['success' => false, 'message' => 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไปเพื่อความปลอดภัย']);
        }

        if (!in_array($role, ['student', 'staff'])) {
            $this->json(['success' => false, 'message' => 'บทบาทผู้ใช้ระบบไม่ถูกต้อง']);
        }

        if ($role === 'student' && strlen($username) !== 10) {
            $this->json(['success' => false, 'message' => 'รหัสนักศึกษาต้องมีความยาว 10 หลักเท่านั้น']);
        }

        try {
            if ($this->userModel->isUsernameExists($username)) {
                $this->json(['success' => false, 'message' => 'รหัสนักศึกษา/ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่นหรือติดต่อผู้ดูแล']);
            }
            
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            $status = ($role === 'staff') ? 'suspended' : 'normal';
            
            $this->userModel->create($username, $password_hash, $first_name, $last_name, $email, $phone, $role, $status);
            
            $msg = ($role === 'staff') ? 'ลงทะเบียนเจ้าหน้าที่สำเร็จ! กรุณารอแอดมินอนุมัติ' : 'สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้ทันที';
            $this->json(['success' => true, 'message' => $msg]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดทางเทคนิค: ' . $e->getMessage()]);
        }
    }

    /**
     * Check current login state
     */
    public function check() {
        $this->startSession();
        if (!isset($_SESSION['user_id'])) {
            $this->json(['logged_in' => false, 'message' => 'Unauthorized'], 401);
        }

        $this->json([
            'logged_in' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'first_name' => $_SESSION['first_name'],
                'last_name' => $_SESSION['last_name'],
                'role' => $_SESSION['role']
            ]
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout() {
        $this->startSession();
        session_unset();
        session_destroy();
        $this->json(['success' => true]);
    }
}
