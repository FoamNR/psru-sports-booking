<?php
// Function to load .env variables
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            
            // Remove wrapping quotes if present
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }

            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv(sprintf('%s=%s', $key, $value));
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

// Load .env from root directory
loadEnv(__DIR__ . '/../.env');

// Configuration for Database connection
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_NAME', getenv('DB_NAME') ?: 'psru_sports');

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    // Set error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $err_code = $e->getCode();
    $err_msg = $e->getMessage();
    
    // Default styling wrapper
    $html_start = "
    <div style='font-family: \"Prompt\", -apple-system, sans-serif; text-align: center; margin-top: 80px; padding: 30px; border-radius: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.08); background-color: #ffffff; border: 1px solid #e2e8f0;'>
        <div style='width: 60px; height: 60px; background-color: #fff5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;'>
            <span style='font-size: 30px;'>⚠️</span>
        </div>";
    
    $html_end = "
        <p style='margin-top: 25px;'>
            <button onclick='window.location.reload()' style='background-color: #01a715; color: white; border: none; padding: 10px 24px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: inherit; font-size: 14px; box-shadow: 0 4px 6px rgba(1, 167, 21, 0.2); transition: all 0.2s;'>รีเฟรชหน้าเว็บเพื่อลองใหม่</button>
        </p>
    </div>";

    if ($err_code == 1049) { // Database not found
        $content = "
            <h2 style='color: #dd6b20; margin-bottom: 10px;'>ไม่พบฐานข้อมูล '" . DB_NAME . "'</h2>
            <p style='color: #4a5568; font-size: 14px;'>กรุณาดำเนินการตามขั้นตอนต่อไปนี้เพื่อสร้างและนำเข้าโครงสร้างตาราง:</p>
            <div style='text-align: left; display: inline-block; background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-top: 15px; font-size: 13px; color: #4a5568; border: 1px solid #edf2f7; line-height: 1.6;'>
                1. เปิดหน้า <strong>phpMyAdmin</strong> ที่ <a href='http://localhost/phpmyadmin' target='_blank' style='color: #01a715; font-weight: bold;'>http://localhost/phpmyadmin</a><br>
                2. สร้างฐานข้อมูลใหม่ชื่อว่า <strong style='color: #2d3748;'>psru_sports</strong> (เลือก Collation เป็น <code>utf8mb4_unicode_ci</code>)<br>
                3. กดแท็บ <strong>Import</strong> ด้านบน เลือกไฟล์ <code>database.sql</code> ในโฟลเดอร์โปรเจกต์<br>
                4. กดปุ่ม <strong>Import</strong> ด้านล่างสุดเพื่อนำเข้าตารางและข้อมูลเริ่มต้น
            </div>";
        die($html_start . $content . $html_end);
    } elseif ($err_code == 2002 || strpos($err_msg, 'Connection refused') !== false || strpos($err_msg, 'cannot connect') !== false) {
        $content = "
            <h2 style='color: #e53e3e; margin-bottom: 10px;'>เชื่อมต่อเซิร์ฟเวอร์ MySQL ล้มเหลว</h2>
            <p style='color: #4a5568; font-size: 14px; line-height: 1.6;'>ดูเหมือนว่าบริการ <strong>MySQL</strong> ของคุณยังไม่ได้เปิดทำงานครับ</p>
            <div style='text-align: left; display: inline-block; background-color: #fffaf0; padding: 20px; border-radius: 12px; margin-top: 15px; font-size: 13px; color: #744210; border: 1px solid #feebc8; line-height: 1.6;'>
                💡 <strong>วิธีแก้ไข:</strong><br>
                1. เปิดโปรแกรม <strong>XAMPP Control Panel</strong> ขึ้นมา<br>
                2. มองหาแถว <strong>MySQL</strong> แล้วกดปุ่ม <strong style='color: #c05621;'>Start</strong> ให้แสดงสถานะเป็นแถบสีเขียว<br>
                3. รีเฟรชหน้าต่างเบราว์เซอร์นี้อีกครั้ง
            </div>";
        die($html_start . $content . $html_end);
    } elseif ($err_code == 1045) { // Access denied
        $content = "
            <h2 style='color: #e53e3e; margin-bottom: 10px;'>ปฏิเสธการเข้าถึงฐานข้อมูล (Access Denied)</h2>
            <p style='color: #4a5568; font-size: 14px; line-height: 1.6;'>ชื่อผู้ใช้งานหรือรหัสผ่านสำหรับเชื่อมต่อ MySQL ไม่ถูกต้อง</p>
            <div style='text-align: left; display: inline-block; background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-top: 15px; font-size: 13px; color: #4a5568; border: 1px solid #edf2f7; line-height: 1.6;'>
                💡 <strong>วิธีแก้ไข:</strong><br>
                กรุณาตรวจสอบการตั้งค่าความเชื่อมโยงในไฟล์: <br>
                <code style='background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;'>config/db.php</code><br>
                - ตรวจสอบค่า <strong>DB_USER</strong> (โดยปกติของ XAMPP คือ <code>root</code>)<br>
                - ตรวจสอบค่า <strong>DB_PASS</strong> (โดยปกติของ XAMPP คือค่าว่าง <code>''</code>)
            </div>";
        die($html_start . $content . $html_end);
    } else { // Other errors
        $content = "
            <h2 style='color: #e53e3e; margin-bottom: 10px;'>เกิดข้อผิดพลาดในการเชื่อมต่อ</h2>
            <p style='color: #4a5568; font-size: 14px; line-height: 1.6;'>ไม่สามารถติดต่อกับฐานข้อมูลระบบได้ในขณะนี้</p>
            <div style='text-align: left; display: inline-block; background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-top: 15px; font-size: 13px; color: #e53e3e; border: 1px solid #edf2f7; font-family: monospace; word-break: break-all;'>
                Error Detail: " . htmlspecialchars($err_msg) . "
            </div>";
        die($html_start . $content . $html_end);
    }
}
?>
