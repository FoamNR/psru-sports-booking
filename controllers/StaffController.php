<?php

class StaffController extends BaseController {
    private $bookingModel;
    private $courtModel;
    private $reportModel;

    public function __construct() {
        $this->bookingModel = new BookingModel();
        $this->courtModel = new CourtModel();
        $this->reportModel = new ReportModel();
    }

    /**
     * Staff dashboard overview data
     */
    public function dashboard() {
        $this->checkRole('staff');

        try {
            $kpis = $this->bookingModel->getKPIs();
            $pendingBookings = $this->bookingModel->getPendingBookings();
            $approvedBookings = $this->bookingModel->getApprovedBookings();
            $rejectedBookings = $this->bookingModel->getRejectedBookings();
            $courts = $this->courtModel->getAll();

            $this->json([
                'success' => true,
                'kpis' => $kpis,
                'pending_bookings' => $pendingBookings,
                'approved_bookings' => $approvedBookings,
                'rejected_bookings' => $rejectedBookings,
                'courts' => $courts
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Dispatcher for staff actions
     */
    public function actions() {
        $this->checkRole('staff');
        $staffId = $_SESSION['user_id'];

        $input = $this->getInput();
        $action = $input['action'] ?? '';

        // 1. Process Booking Action (Approve / Reject)
        if ($action === 'booking_action') {
            $bookingId = intval($input['booking_id'] ?? 0);
            $actionType = $input['action_type'] ?? ''; // approve, reject
            $reason = trim($input['reason'] ?? '');
            
            if ($bookingId <= 0 || !in_array($actionType, ['approve', 'reject'])) {
                $this->json(['success' => false, 'message' => 'Invalid parameters']);
            }
            
            $status = ($actionType === 'approve') ? 'approved' : 'rejected';
            
            try {
                $this->bookingModel->updateStatus($bookingId, $status, $staffId, $reason);
                $this->json(['success' => true, 'message' => 'ดำเนินการบันทึกคำขอจองสำเร็จเรียบร้อยแล้ว']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => $e->getMessage()]);
            }
        }

        // 2. Update Court Status
        if ($action === 'update_court_status') {
            $courtId = intval($input['court_id'] ?? 0);
            $courtStatus = $input['court_status'] ?? ''; // ready, maintenance, closed
            
            if ($courtId <= 0 || !in_array($courtStatus, ['ready', 'maintenance', 'closed'])) {
                $this->json(['success' => false, 'message' => 'Invalid parameters']);
            }
            
            try {
                $this->courtModel->updateStatus($courtId, $courtStatus);
                $this->json(['success' => true, 'message' => 'อัปเดตความพร้อมของสนามสำเร็จ']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => $e->getMessage()]);
            }
        }

        // 3. Submit Problem Report
        if ($action === 'report_issue') {
            $courtId = intval($input['report_court_id'] ?? 0);
            $description = trim($input['report_description'] ?? '');
            
            if ($courtId <= 0 || empty($description)) {
                $this->json(['success' => false, 'message' => 'กรุณากรอกข้อมูลและเลือกสนามที่ชำรุด']);
            }
            
            try {
                $this->reportModel->create($staffId, $courtId, $description);
                $this->json(['success' => true, 'message' => 'ส่งรายงานเหตุชำรุด/งดใช้งานส่งผู้ดูแลระบบส่วนกลางสำเร็จ']);
            } catch (PDOException $e) {
                $this->json(['success' => false, 'message' => $e->getMessage()]);
            }
        }

        $this->json(['success' => false, 'message' => 'Invalid Action']);
    }
}
