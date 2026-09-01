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
     * Create a new booking (supports single or multiple days, and custom time ranges)
     */
    public function create() {
        $this->checkRole('student');
        $userId = $_SESSION['user_id'];

        $input = $this->getInput();
        $courtId = intval($input['court_id'] ?? 0);
        $bookingTitle = trim($input['booking_title'] ?? $input['title'] ?? $input['purpose'] ?? '');
        $additionalRequest = trim($input['additional_request'] ?? '');

        if (empty($bookingTitle)) {
            $this->json(['success' => false, 'message' => 'กรุณากรอกหัวข้อหรือวัตถุประสงค์การจองสนาม (จำเป็นต้องระบุ)']);
        }

        // 1. Parse booking dates (array, range, or single date)
        $bookingDates = [];
        if (!empty($input['booking_dates']) && is_array($input['booking_dates'])) {
            $bookingDates = $input['booking_dates'];
        } elseif (!empty($input['start_date']) && !empty($input['end_date'])) {
            $startDt = new DateTime(trim($input['start_date']));
            $endDt = new DateTime(trim($input['end_date']));
            if ($startDt > $endDt) {
                $this->json(['success' => false, 'message' => 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด']);
            }
            $interval = new DateInterval('P1D');
            $period = new DatePeriod($startDt, $interval, $endDt->modify('+1 day'));
            foreach ($period as $dt) {
                $bookingDates[] = $dt->format('Y-m-d');
            }
        } elseif (!empty($input['booking_date'])) {
            $bookingDates = [trim($input['booking_date'])];
        }

        // Clean & validate dates
        $today = date('Y-m-d');
        $validDates = [];
        foreach ($bookingDates as $d) {
            $d = trim($d);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
                if ($d < $today) {
                    $this->json(['success' => false, 'message' => "ไม่สามารถเลือกวันที่ในอดีตได้ ($d)"]);
                }
                $validDates[] = $d;
            }
        }
        $validDates = array_values(array_unique($validDates));
        sort($validDates);

        if ($courtId <= 0 || empty($validDates)) {
            $this->json(['success' => false, 'message' => 'กรุณาระบุสนามและเลือกวันที่ต้องการจองให้ครบถ้วน']);
        }

        if (count($validDates) > 30) {
            $this->json(['success' => false, 'message' => 'สามารถเลือกจองได้สูงสุดไม่เกิน 30 วันต่อครั้ง']);
        }

        // 2. Parse Start Time & End Time
        $startTime = '';
        $endTime = '';

        if (!empty($input['start_time']) && !empty($input['end_time'])) {
            $startTime = trim($input['start_time']);
            $endTime = trim($input['end_time']);
        } elseif (!empty($input['time_slot'])) {
            $timeParts = explode('-', trim($input['time_slot']));
            if (count($timeParts) === 2) {
                $startTime = trim($timeParts[0]);
                $endTime = trim($timeParts[1]);
            }
        }

        // Normalize time format to HH:MM:00
        if (preg_match('/^\d{1,2}:\d{2}$/', $startTime)) {
            $startTime .= ':00';
        }
        if (preg_match('/^\d{1,2}:\d{2}$/', $endTime)) {
            $endTime .= ':00';
        }

        if (!preg_match('/^\d{2}:\d{2}:\d{2}$/', $startTime) || !preg_match('/^\d{2}:\d{2}:\d{2}$/', $endTime)) {
            $this->json(['success' => false, 'message' => 'กรุณาระบุเวลาเริ่มต้นและเวลาสิ้นสุดให้ถูกต้อง']);
        }

        if (strtotime($startTime) >= strtotime($endTime)) {
            $this->json(['success' => false, 'message' => 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุดการใช้งาน']);
        }

        // 3. Verify Court status & Operating hours
        if (class_exists('CourtModel')) {
            $courtModel = new CourtModel();
            $court = $courtModel->getById($courtId);
            if (!$court) {
                $this->json(['success' => false, 'message' => 'ไม่พบข้อมูลสนามกีฬาที่เลือก']);
            }
            if ($court['status'] !== 'ready') {
                $this->json(['success' => false, 'message' => 'สนามกีฬาปิดปรับปรุงหรือไม่พร้อมให้บริการในขณะนี้']);
            }
            if ($startTime < $court['opening_time'] || $endTime > $court['closing_time']) {
                $openStr = substr($court['opening_time'], 0, 5);
                $closeStr = substr($court['closing_time'], 0, 5);
                $this->json(['success' => false, 'message' => "สนามนี้เปิดให้บริการเวลา $openStr - $closeStr น. เท่านั้น"]);
            }
        }

        try {
            // 4. Validate slot conflicts (overlap check) for each date
            $displayTimeRange = substr($startTime, 0, 5) . ' - ' . substr($endTime, 0, 5);
            foreach ($validDates as $date) {
                // Check conflict/overlap
                if ($this->bookingModel->isSlotBooked($courtId, $date, $startTime, $endTime)) {
                    $this->json([
                        'success' => false, 
                        'message' => "ขออภัย ช่วงเวลา $displayTimeRange น. ในวันที่ $date มีผู้จองแล้ว"
                    ]);
                }
            }

            // 5. Build and insert bookings
            $bookingsToInsert = [];
            foreach ($validDates as $date) {
                $bookingCode = 'BK' . date('ymd') . rand(1000, 9999);
                $bookingsToInsert[] = [
                    'booking_code' => $bookingCode,
                    'user_id' => $userId,
                    'court_id' => $courtId,
                    'booking_date' => $date,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'booking_title' => $bookingTitle,
                    'additional_request' => $additionalRequest
                ];
            }

            $createdCodes = $this->bookingModel->createMultiple($bookingsToInsert);
            $totalDays = count($createdCodes);

            $message = ($totalDays === 1)
                ? "จองสนามสำเร็จแล้ว! รหัสคิวของคุณคือ {$createdCodes[0]} กรุณารอเจ้าหน้าที่ตรวจสอบอนุมัติ"
                : "จองสนามสำเร็จทั้งหมด $totalDays วัน! กรุณารอเจ้าหน้าที่ตรวจสอบอนุมัติ";

            $this->json([
                'success' => true,
                'message' => $message,
                'booking_code' => $createdCodes[0],
                'booking_codes' => $createdCodes,
                'total_days' => $totalDays
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
