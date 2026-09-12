<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ReportModel.php';
require_once __DIR__ . '/../models/CourtModel.php';

class ReportController extends BaseController {
    private $reportModel;
    private $courtModel;

    public function __construct() {
        $this->reportModel = new ReportModel();
        $this->courtModel = new CourtModel();
    }

    /**
     * List all reports with statistics
     */
    public function list() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', ['admin', 'staff'])) {
            $this->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้'], 403);
        }

        $status = isset($_GET['status']) && !empty($_GET['status']) ? trim($_GET['status']) : null;
        $campusId = isset($_GET['campus_id']) && intval($_GET['campus_id']) > 0 ? intval($_GET['campus_id']) : null;

        try {
            $reports = $this->reportModel->getAll($status, $campusId);
            $stats = $this->reportModel->getStats();

            $this->json([
                'success' => true,
                'reports' => $reports,
                'stats' => $stats
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single report details
     */
    public function detail() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'] ?? '', ['admin', 'staff'])) {
            $this->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้'], 403);
        }

        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0) {
            $this->json(['success' => false, 'message' => 'รหัสรายงานไม่ถูกต้อง']);
        }

        try {
            $report = $this->reportModel->getById($id);
            if (!$report) {
                $this->json(['success' => false, 'message' => 'ไม่พบข้อมูลรายงานที่ต้องการ']);
            }

            $this->json([
                'success' => true,
                'report' => $report
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update report status (Admin only)
     */
    public function updateStatus() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
            $this->json(['success' => false, 'message' => 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยนสถานะรายงานได้'], 403);
        }

        $input = $this->getInput();
        $id = intval($input['id'] ?? 0);
        $status = trim($input['status'] ?? '');

        if ($id <= 0 || !in_array($status, ['pending', 'resolved'])) {
            $this->json(['success' => false, 'message' => 'ข้อมูลสถานะหรือรหัสรายงานไม่ถูกต้อง']);
        }

        try {
            $report = $this->reportModel->getById($id);
            if (!$report) {
                $this->json(['success' => false, 'message' => 'ไม่พบรายการรายงานที่ต้องการแก้ไข']);
            }

            $success = $this->reportModel->updateStatus($id, $status);
            if ($success) {
                $statusText = $status === 'resolved' ? 'แก้ไขปัญหาเสร็จสิ้นแล้ว' : 'เปลี่ยนกลับเป็นรอดำเนินการ';
                $this->json([
                    'success' => true,
                    'message' => "อัปเดตสถานะรายงาน #{$id} เป็น \"{$statusText}\" สำเร็จ",
                    'new_status' => $status
                ]);
            } else {
                $this->json(['success' => false, 'message' => 'ไม่สามารถบันทึกการเปลี่ยนสถานะได้']);
            }
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการปรับปรุงสถานะ: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete report (Admin only)
     */
    public function delete() {
        $this->startSession();
        if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
            $this->json(['success' => false, 'message' => 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบรายงานได้'], 403);
        }

        $input = $this->getInput();
        $id = intval($input['id'] ?? 0);

        if ($id <= 0) {
            $this->json(['success' => false, 'message' => 'รหัสรายงานไม่ถูกต้อง']);
        }

        try {
            $report = $this->reportModel->getById($id);
            if (!$report) {
                $this->json(['success' => false, 'message' => 'ไม่พบรายการรายงานที่ต้องการลบ']);
            }

            $this->reportModel->delete($id);
            $this->json([
                'success' => true,
                'message' => 'ลบรายการรายงานปัญหาเรียบร้อยแล้ว'
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการลบรายการ: ' . $e->getMessage()], 500);
        }
    }
}
