<?php

class BookingModel extends BaseModel {
    /**
     * Get bookings of a user
     * 
     * @param int $userId
     * @return array
     */
    public function getUserBookings($userId) {
        $stmt = $this->db->prepare("
            SELECT b.*, c.name AS court_name, c.sport_type, cam.name AS campus_name 
            FROM bookings b
            JOIN courts c ON b.court_id = c.id
            JOIN campuses cam ON c.campus_id = cam.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    /**
     * Get booking count for a user on a specific date
     * 
     * @param int $userId
     * @param string $date
     * @return int
     */
    public function getBookingCountForDate($userId, $date) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM bookings 
            WHERE user_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'completed')
        ");
        $stmt->execute([$userId, $date]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Check if a court slot is already booked on a date
     * 
     * @param int $courtId
     * @param string $date
     * @param string $startTime
     * @return bool
     */
    public function isSlotBooked($courtId, $date, $startTime) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM bookings 
            WHERE court_id = ? AND booking_date = ? AND start_time = ? AND status IN ('pending', 'approved', 'completed')
        ");
        $stmt->execute([$courtId, $date, $startTime]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Create a booking
     * 
     * @return bool
     */
    public function create($bookingCode, $userId, $courtId, $bookingDate, $startTime, $endTime, $additionalRequest) {
        $stmt = $this->db->prepare("
            INSERT INTO bookings (booking_code, user_id, court_id, booking_date, start_time, end_time, status, additional_request) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        ");
        return $stmt->execute([
            $bookingCode,
            $userId,
            $courtId,
            $bookingDate,
            $startTime,
            $endTime,
            $additionalRequest
        ]);
    }

    /**
     * Cancel a booking by the student (only if status is pending)
     * 
     * @return int Number of rows affected
     */
    public function cancel($bookingId, $userId) {
        $stmt = $this->db->prepare("
            UPDATE bookings SET status = 'cancelled' 
            WHERE id = ? AND user_id = ? AND status = 'pending'
        ");
        $stmt->execute([$bookingId, $userId]);
        return $stmt->rowCount();
    }

    /**
     * Get busy slots for a court on a date
     * 
     * @param int $courtId
     * @param string $date
     * @return array
     */
    public function getBookedSlots($courtId, $date) {
        $stmt = $this->db->prepare("
            SELECT start_time, end_time 
            FROM bookings 
            WHERE court_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'completed')
        ");
        $stmt->execute([$courtId, $date]);
        return $stmt->fetchAll();
    }

    /**
     * Get pending bookings
     * 
     * @return array
     */
    public function getPendingBookings() {
        $stmt = $this->db->query("
            SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN courts c ON b.court_id = c.id
            WHERE b.status = 'pending'
            ORDER BY b.id ASC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Get approved bookings
     * 
     * @return array
     */
    public function getApprovedBookings() {
        $stmt = $this->db->query("
            SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type, staff.first_name AS staff_first, staff.last_name AS staff_last
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN courts c ON b.court_id = c.id
            LEFT JOIN users staff ON b.approved_by = staff.id
            WHERE b.status = 'approved'
            ORDER BY b.booking_date DESC, b.start_time DESC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Get rejected bookings
     * 
     * @return array
     */
    public function getRejectedBookings() {
        $stmt = $this->db->query("
            SELECT b.*, u.first_name, u.last_name, u.username, u.email, u.phone, c.name AS court_name, c.sport_type, staff.first_name AS staff_first, staff.last_name AS staff_last
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN courts c ON b.court_id = c.id
            LEFT JOIN users staff ON b.approved_by = staff.id
            WHERE b.status = 'rejected'
            ORDER BY b.booking_date DESC, b.start_time DESC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Update booking status (by staff action)
     * 
     * @return bool
     */
    public function updateStatus($bookingId, $status, $staffId, $reason = '') {
        $stmt = $this->db->prepare("
            UPDATE bookings 
            SET status = ?, approved_by = ?, rejection_reason = ? 
            WHERE id = ? AND status = 'pending'
        ");
        return $stmt->execute([$status, $staffId, $reason, $bookingId]);
    }

    /**
     * Retrieve staff dashboard KPI stats
     * 
     * @return array
     */
    public function getKPIs() {
        $pending_count = $this->db->query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'")->fetchColumn();
        $approved_today_count = $this->db->query("SELECT COUNT(*) FROM bookings WHERE status = 'approved' AND booking_date = CURDATE()")->fetchColumn();
        
        $completed_count = $this->db->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'")->fetchColumn();
        $total_today_count = $this->db->query("SELECT COUNT(*) FROM bookings WHERE booking_date = CURDATE()")->fetchColumn();
        $checkin_rate = ($total_today_count > 0) ? round(($completed_count / $total_today_count) * 100) : 85;
        
        $popular_stmt = $this->db->query("
            SELECT c.name, COUNT(b.id) AS count 
            FROM bookings b 
            JOIN courts c ON b.court_id = c.id 
            GROUP BY b.court_id 
            ORDER BY count DESC 
            LIMIT 1
        ");
        $popular = $popular_stmt->fetch();
        $popular_court_name = $popular ? $popular['name'] : 'ไม่มีข้อมูลการจอง';

        return [
            'pending_count' => (int)$pending_count,
            'approved_today_count' => (int)$approved_today_count,
            'checkin_rate' => (int)$checkin_rate,
            'popular_court_name' => $popular_court_name
        ];
    }
}
