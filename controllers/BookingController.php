<?php

class BookingController extends BaseController {
    private $bookingModel;

    public function __construct() {
        $this->bookingModel = new BookingModel();
    }

    /**
     * List current user's bookings
     */
    public function listUserBookings() {
        $this->startSession();
        if (!isset($_SESSION['user_id'])) {
            $this->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $userId = $_SESSION['user_id'];

        try {
            $bookings = $this->bookingModel->getUserBookings($userId);
            $this->json([
                'success' => true,
                'bookings' => $bookings
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new booking
     */
    public function create() {
        $this->checkRole('student');
        $userId = $_SESSION['user_id'];

        $input = $this->getInput();
        $courtId = intval($input['court_id'] ?? 0);
        $bookingDate = trim($input['booking_date'] ?? '');
        $timeSlot = trim($input['time_slot'] ?? ''); // e.g. "17:00-18:00"
        $additionalRequest = trim($input['additional_request'] ?? '');

        if ($courtId <= 0 || empty($bookingDate) || empty($timeSlot)) {
            $this->json(['success' => false, 'message' => 'กรุณาระบุข้อมูลสนาม วันที่ และเวลาจองให้ครบถ้วน']);
        }

        $timeParts = explode('-', $timeSlot);
        if (count($timeParts) !== 2) {
            $this->json(['success' => false, 'message' => 'รูปแบบช่วงเวลาไม่ถูกต้อง']);
        }

        $startTime = trim($timeParts[0]) . ':00';
        $endTime = trim($timeParts[1]) . ':00';

        try {
            // 1. Enforce booking quota (1 booking / student / day)
            $existingCount = $this->bookingModel->getBookingCountForDate($userId, $bookingDate);
            if ($existingCount > 0) {
                $this->json(['success' => false, 'message' => 'ขออภัย จำกัดสิทธิ์การจองสนามกีฬา 1 ครั้ง / วัน / คนเท่านั้นครับ']);
            }

            // 2. Double check slot availability
            if ($this->bookingModel->isSlotBooked($courtId, $bookingDate, $startTime)) {
                $this->json(['success' => false, 'message' => 'ขออภัย ช่วงเวลาดังกล่าวมีผู้ใช้งานอื่นจองสำเร็จไปก่อนหน้านี้แล้ว']);
            }

            // 3. Insert booking
            $bookingCode = 'BK' . date('ymd') . rand(1000, 9999);
            $this->bookingModel->create($bookingCode, $userId, $courtId, $bookingDate, $startTime, $endTime, $additionalRequest);

            $this->json([
                'success' => true,
                'message' => "จองสนามสำเร็จแล้ว! รหัสคิวของคุณคือ $bookingCode กรุณารอเจ้าหน้าที่ตรวจสอบอนุมัติ",
                'booking_code' => $bookingCode
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกคำขอ: ' . $e->getMessage()]);
        }
    }

    /**
     * Cancel a booking
     */
    public function cancel() {
        $this->startSession();
        if (!isset($_SESSION['user_id'])) {
            $this->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $userId = $_SESSION['user_id'];
        $input = $this->getInput();
        $bookingId = intval($input['booking_id'] ?? 0);

        if ($bookingId <= 0) {
            $this->json(['success' => false, 'message' => 'Invalid Booking ID']);
        }

        try {
            $rows = $this->bookingModel->cancel($bookingId, $userId);
            if ($rows > 0) {
                $this->json(['success' => true, 'message' => 'ยกเลิกการจองสำเร็จ']);
            } else {
                $this->json(['success' => false, 'message' => 'ไม่สามารถยกเลิกได้ เนื่องจากอาจอยู่ในขั้นตอนอนุมัติแล้ว หรือไม่ใช่การจองของคุณ']);
            }
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
