<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if the user is authenticated and has the correct role
 * @param string|array $required_roles Role or roles allowed (e.g. 'student', 'staff', 'admin')
 * @return void
 */
function check_auth($required_roles = []) {
    if (!isset($_SESSION['user_id'])) {
        // Find relative path to login.php
        $login_path = (basename($_SERVER['SCRIPT_NAME']) === 'dashboard.php' || basename($_SERVER['SCRIPT_NAME']) === 'add-court.php') ? '../login.php' : 'login.php';
        header("Location: " . $login_path);
        exit();
    }
    
    if (!empty($required_roles)) {
        if (is_string($required_roles)) {
            $required_roles = [$required_roles];
        }
        
        if (!in_array($_SESSION['role'], $required_roles)) {
            // Role not authorized
            die("
            <div style='font-family: \"Prompt\", sans-serif; text-align: center; margin-top: 100px; padding: 30px; border: 1px solid #feb2b2; background-color: #fff5f5; max-width: 500px; margin-left: auto; margin-right: auto; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
                <h2 style='color: #c53030;'>❌ ปฏิเสธการเข้าถึง (Access Denied)</h2>
                <p style='color: #4a5568;'>คุณไม่มีสิทธิ์ในการเข้าถึงหน้าต่างควบคุมนี้</p>
                <p style='margin-top: 20px;'><a href='" . ($_SESSION['role'] === 'student' ? 'index.php' : ($_SESSION['role'] === 'staff' ? '../staff/dashboard.php' : '../admin/dashboard.php')) . "' style='background-color: #4a5568; color: white; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: bold;'>กลับไปยังหน้าหลักของคุณ</a></p>
            </div>
            ");
        }
    }
}

/**
 * Get details of the currently logged-in user
 * @return array|null
 */
function get_logged_user() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'first_name' => $_SESSION['first_name'],
        'last_name' => $_SESSION['last_name'],
        'role' => $_SESSION['role'],
        'display_name' => $_SESSION['first_name'] . ' ' . $_SESSION['last_name']
    ];
}
?>
