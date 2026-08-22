<?php

class AdminController extends BaseController {
    private $userModel;
    private $courtModel;
    private $campusModel;
    private $newsModel;

    public function __construct() {
        $this->userModel = new UserModel();
        $this->courtModel = new CourtModel();
        $this->campusModel = new CampusModel();
        $this->newsModel = new NewsModel();
    }

    /**
     * Handle Admin Dashboard queries and actions
     */
    public function dashboard() {
        $this->checkRole('admin');
        $adminId = $_SESSION['user_id'];

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                $users = $this->userModel->getAllExcept($adminId);
                $courts = $this->courtModel->getAll(true);
                $campuses = $this->campusModel->getAll();

                $this->json([
                    'success' => true,
                    'users' => $users,
                    'courts' => $courts,
                    'campuses' => $campuses
                ]);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => $e->getMessage()], 500);
            }
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = $this->getInput();
            $action = $input['action'] ?? '';

            if ($action === 'create_user') {
                $username = trim($input['username'] ?? '');
                $password = trim($input['password'] ?? '');
                $firstName = trim($input['first_name'] ?? '');
                $lastName = trim($input['last_name'] ?? '');
                $email = trim($input['email'] ?? '');
                $phone = trim($input['phone'] ?? '');
                $role = trim($input['role'] ?? 'student');
                $status = trim($input['status'] ?? 'normal');
                
                if (empty($username) || empty($password) || empty($firstName) || empty($lastName) || empty($email) || empty($phone)) {
                    $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลด่วนสำคัญให้ครบถ้วนทุกช่องครับ']);
                }
                
                if (strlen($password) < 6) {
                    $this->json(['success' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']);
                }
                
                try {
                    if ($this->userModel->isUsernameExists($username)) {
                        $this->json(['success' => false, 'message' => 'ชื่อผู้ใช้นี้มีในระบบแล้ว']);
                    }
                    
                    $pwdHash = password_hash($password, PASSWORD_BCRYPT);
                    $this->userModel->create($username, $pwdHash, $firstName, $lastName, $email, $phone, $role, $status);
                    
                    $this->json(['success' => true, 'message' => 'เพิ่มผู้ใช้ใหม่สำเร็จ']);
                } catch (PDOException $e) {
                    $this->json(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            
            if ($action === 'edit_user') {
                $targetId = intval($input['target_id'] ?? 0);
                $firstName = trim($input['first_name'] ?? '');
                $lastName = trim($input['last_name'] ?? '');
                $email = trim($input['email'] ?? '');
                $phone = trim($input['phone'] ?? '');
                $role = trim($input['role'] ?? 'student');
                $status = trim($input['status'] ?? 'normal');
                $newPassword = trim($input['new_password'] ?? '');
                
                if ($targetId <= 0 || empty($firstName) || empty($lastName)) {
                    $this->json(['success' => false, 'message' => 'กรุณากรอกชื่อจริงและนามสกุล']);
                }
                
                try {
                    $pwdHash = null;
                    if (!empty($newPassword)) {
                        if (strlen($newPassword) < 6) {
                            $this->json(['success' => false, 'message' => 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร']);
                        }
                        $pwdHash = password_hash($newPassword, PASSWORD_BCRYPT);
                    }
                    
                    $this->userModel->update($targetId, $firstName, $lastName, $email, $phone, $role, $status, $pwdHash);
                    $this->json(['success' => true, 'message' => 'แก้ไขบัญชีผู้ใช้สำเร็จ']);
                } catch (PDOException $e) {
                    $this->json(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            
            if ($action === 'toggle_status') {
                $targetId = intval($input['target_id'] ?? 0);
                
                if ($targetId <= 0) {
                    $this->json(['success' => false, 'message' => 'Invalid ID']);
                }
                
                try {
                    $newStatus = $this->userModel->toggleStatus($targetId);
                    if ($newStatus) {
                        $this->json(['success' => true, 'message' => 'สลับสถานะผู้ใช้สำเร็จ', 'new_status' => $newStatus]);
                    } else {
                        $this->json(['success' => false, 'message' => 'ไม่พบผู้ใช้หรือสลับสถานะไม่สำเร็จ']);
                    }
                } catch (PDOException $e) {
                    $this->json(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            
            if ($action === 'delete_user') {
                $targetId = intval($input['target_id'] ?? 0);
                
                if ($targetId <= 0) {
                    $this->json(['success' => false, 'message' => 'Invalid ID']);
                }
                
                try {
                    $this->userModel->delete($targetId);
                    $this->json(['success' => true, 'message' => 'ลบผู้ใช้สำเร็จ']);
                } catch (PDOException $e) {
                    $this->json(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            
            if ($action === 'publish_news') {
                $title = trim($input['news_title'] ?? '');
                $content = trim($input['news_content'] ?? '');
                
                if (empty($title) || empty($content)) {
                    $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลหัวข้อและเนื้อหาประกาศ']);
                }
                
                try {
                    $this->newsModel->publish($title, $content, $adminId);
                    $this->json(['success' => true, 'message' => 'อัพเดตประกาศและข่าวสารระบบเรียบร้อยแล้ว']);
                } catch (PDOException $e) {
                    $this->json(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            
            $this->json(['success' => false, 'message' => 'Invalid Action']);
        }
    }

    /**
     * Handle Admin Court modifications (create, update, delete)
     */
    public function courtAction() {
        $this->checkRole('admin');

        $action = $_POST['action'] ?? $_GET['action'] ?? '';

        // 1. Delete Court Action
        if ($action === 'delete_court') {
            $courtId = intval($_GET['court_id'] ?? $_POST['court_id'] ?? 0);
            if ($courtId <= 0) {
                $this->json(['success' => false, 'message' => 'Invalid Court ID']);
            }
            
            try {
                $this->courtModel->delete($courtId);
                $this->json(['success' => true, 'message' => 'ลบข้อมูลสนามกีฬาเรียบร้อยแล้ว']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => 'ไม่สามารถลบสนามนี้ได้เนื่องจากอาจมีประวัติการจองค้างอยู่: ' . $e->getMessage()]);
            }
        }

        // 2. Create Court Action
        if ($action === 'create_court') {
            $courtName = trim($_POST['court_name'] ?? '');
            $sportType = $_POST['sport_type'] ?? '';
            $campusId = intval($_POST['campus_id'] ?? 0);
            $locationType = $_POST['location_type'] ?? 'indoor';
            $description = trim($_POST['description'] ?? '');
            $openingTime = ($_POST['opening_time'] ?? '08:00') . ':00';
            $closingTime = ($_POST['closing_time'] ?? '20:00') . ':00';
            $maxBookingHours = intval($_POST['max_booking_hours'] ?? 2);
            $facilities = $_POST['facilities'] ?? [];
            
            if (empty($courtName) || empty($sportType) || $campusId <= 0) {
                $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน']);
            }
            
            // File Upload handling
            $imageName = 'default_court.jpg';
            if (isset($_FILES['court_image']) && $_FILES['court_image']['error'] === UPLOAD_ERR_OK) {
                $fileTmp = $_FILES['court_image']['tmp_name'];
                $fileOriginal = $_FILES['court_image']['name'];
                $fileExt = strtolower(pathinfo($fileOriginal, PATHINFO_EXTENSION));
                
                $allowed = ['jpg', 'jpeg', 'png', 'gif'];
                if (in_array($fileExt, $allowed)) {
                    $uniqueName = uniqid('court_', true) . '.' . $fileExt;
                    $dest = dirname(__DIR__) . '/uploads/courts/' . $uniqueName;
                    if (move_uploaded_file($fileTmp, $dest)) {
                        $imageName = $uniqueName;
                    }
                }
            }
            
            try {
                $this->courtModel->create(
                    $campusId,
                    $courtName,
                    $sportType,
                    $description,
                    $locationType,
                    $openingTime,
                    $closingTime,
                    $maxBookingHours,
                    $imageName,
                    $facilities
                );
                $this->json(['success' => true, 'message' => 'เพิ่มสนามกีฬาแห่งใหม่สำเร็จเรียบร้อย!']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()]);
            }
        }

        // 3. Update Court Action
        if ($action === 'update_court') {
            $courtId = intval($_POST['court_id'] ?? 0);
            $courtName = trim($_POST['court_name'] ?? '');
            $sportType = $_POST['sport_type'] ?? '';
            $campusId = intval($_POST['campus_id'] ?? 0);
            $locationType = $_POST['location_type'] ?? 'indoor';
            $description = trim($_POST['description'] ?? '');
            $openingTime = ($_POST['opening_time'] ?? '08:00') . ':00';
            $closingTime = ($_POST['closing_time'] ?? '20:00') . ':00';
            $maxBookingHours = intval($_POST['max_booking_hours'] ?? 2);
            $facilities = $_POST['facilities'] ?? [];
            
            if ($courtId <= 0 || empty($courtName) || empty($sportType) || $campusId <= 0) {
                $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน']);
            }
            
            $newImageName = null;
            if (isset($_FILES['court_image']) && $_FILES['court_image']['error'] === UPLOAD_ERR_OK) {
                $fileTmp = $_FILES['court_image']['tmp_name'];
                $fileOriginal = $_FILES['court_image']['name'];
                $fileExt = strtolower(pathinfo($fileOriginal, PATHINFO_EXTENSION));
                
                $allowed = ['jpg', 'jpeg', 'png', 'gif'];
                if (in_array($fileExt, $allowed)) {
                    $uniqueName = uniqid('court_', true) . '.' . $fileExt;
                    $dest = dirname(__DIR__) . '/uploads/courts/' . $uniqueName;
                    if (move_uploaded_file($fileTmp, $dest)) {
                        $newImageName = $uniqueName;
                    }
                }
            }
            
            try {
                $this->courtModel->update(
                    $courtId,
                    $campusId,
                    $courtName,
                    $sportType,
                    $description,
                    $locationType,
                    $openingTime,
                    $closingTime,
                    $maxBookingHours,
                    $newImageName,
                    $facilities
                );
                $this->json(['success' => true, 'message' => 'อัปเดตข้อมูลรายละเอียดสนามกีฬาสำเร็จเรียบร้อย!']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()]);
            }
        }

        $this->json(['success' => false, 'message' => 'Invalid Action']);
    }
}
