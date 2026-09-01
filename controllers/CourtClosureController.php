<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/CourtClosureModel.php';
require_once __DIR__ . '/../models/CourtModel.php';

class CourtClosureController extends BaseController {
    private $closureModel;
    private $courtModel;

    public function __construct() {
        $this->closureModel = new CourtClosureModel();
        $this->courtModel = new CourtModel();
    }

    /**
     * List closures
     */
    public function list() {
        $courtId = isset($_GET['court_id']) && intval($_GET['court_id']) > 0 ? intval($_GET['court_id']) : null;
        $upcomingOnly = isset($_GET['upcoming']) && $_GET['upcoming'] === '1';

        if ($upcomingOnly) {
            $closures = $this->closureModel->getActiveAndUpcoming($courtId);
        } elseif ($courtId) {
            $closures = $this->closureModel->getActiveAndUpcoming($courtId);
        } else {
            $closures = $this->closureModel->getAll();
        }

        $this->json([
            'success' => true,
            'closures' => $closures
        ]);
    }

    /**
     * Create a closure (Staff or Admin only)
     */
    public function create() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', ['admin', 'staff'])) {
            $this->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์ในการจัดการวันปิดใช้งานสนาม'], 403);
        }

        $userId = $_SESSION['user_id'];
        $input = $this->getInput();

        $courtId = intval($input['court_id'] ?? 0);
        $startDate = trim($input['start_date'] ?? '');
        $endDate = trim($input['end_date'] ?? $startDate);
        $startTime = !empty($input['start_time']) ? trim($input['start_time']) : null;
        $endTime = !empty($input['end_time']) ? trim($input['end_time']) : null;
        $reason = trim($input['reason'] ?? '');

        if ($courtId <= 0 || empty($startDate) || empty($endDate) || empty($reason)) {
            $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลสนาม วันที่ และเหตุผลการปิดใช้งานให้ครบถ้วน']);
        }

        if ($startDate > $endDate) {
            $this->json(['success' => false, 'message' => 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด']);
        }

        if ($startTime && $endTime && $startTime >= $endTime) {
            $this->json(['success' => false, 'message' => 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด']);
        }

        // Verify court exists
        $court = $this->courtModel->getById($courtId);
        if (!$court) {
            $this->json(['success' => false, 'message' => 'ไม่พบข้อมูลสนามกีฬาที่ระบุ']);
        }

        try {
            $this->closureModel->create($courtId, $startDate, $endDate, $startTime, $endTime, $reason, $userId);
            $this->json([
                'success' => true,
                'message' => "บันทึกการปิดใช้งาน {$court['name']} สำเร็จเนื่องจาก: $reason"
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึก: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a closure (Staff or Admin only)
     */
    public function delete() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', ['admin', 'staff'])) {
            $this->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์ในการลบรายการปิดสนาม'], 403);
        }

        $input = $this->getInput();
        $id = intval($input['id'] ?? 0);

        if ($id <= 0) {
            $this->json(['success' => false, 'message' => 'รหัสรายการปิดสนามไม่ถูกต้อง']);
        }

        $closure = $this->closureModel->getById($id);
        if (!$closure) {
            $this->json(['success' => false, 'message' => 'ไม่พบรายการปิดสนามที่ต้องการลบ']);
        }

        try {
            $this->closureModel->delete($id);
            $this->json([
                'success' => true,
                'message' => 'ยกเลิกการปิดใช้งานสนามเรียบร้อยแล้ว'
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการลบรายการ: ' . $e->getMessage()]);
        }
    }
}
