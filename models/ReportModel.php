<?php
require_once __DIR__ . '/BaseModel.php';

class ReportModel extends BaseModel {
    /**
     * Create a maintenance/issue report for a court
     * 
     * @param int $staffId
     * @param int $courtId
     * @param string $description
     * @return bool
     */
    public function create($staffId, $courtId, $description) {
        $stmt = $this->db->prepare("INSERT INTO reports (staff_id, court_id, description, status) VALUES (?, ?, ?, 'pending')");
        return $stmt->execute([$staffId, $courtId, $description]);
    }

    /**
     * Get all reports with court, campus, and staff details
     * 
     * @param string|null $status
     * @param int|null $campusId
     * @return array
     */
    public function getAll($status = null, $campusId = null) {
        $sql = "
            SELECT r.*,
                   c.name AS court_name,
                   c.sport_type,
                   c.location_type,
                   c.status AS court_status,
                   cp.id AS campus_id,
                   cp.name AS campus_name,
                   u.username AS staff_username,
                   u.first_name AS staff_first_name,
                   u.last_name AS staff_last_name,
                   u.phone AS staff_phone,
                   u.email AS staff_email
            FROM reports r
            JOIN courts c ON r.court_id = c.id
            JOIN campuses cp ON c.campus_id = cp.id
            JOIN users u ON r.staff_id = u.id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($status) && in_array($status, ['pending', 'resolved'])) {
            $sql .= " AND r.status = ?";
            $params[] = $status;
        }

        if (!empty($campusId) && intval($campusId) > 0) {
            $sql .= " AND cp.id = ?";
            $params[] = intval($campusId);
        }

        $sql .= " ORDER BY r.created_at DESC, r.id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Get single report by ID
     * 
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $stmt = $this->db->prepare("
            SELECT r.*,
                   c.name AS court_name,
                   c.sport_type,
                   c.location_type,
                   c.status AS court_status,
                   cp.id AS campus_id,
                   cp.name AS campus_name,
                   u.username AS staff_username,
                   u.first_name AS staff_first_name,
                   u.last_name AS staff_last_name,
                   u.phone AS staff_phone,
                   u.email AS staff_email
            FROM reports r
            JOIN courts c ON r.court_id = c.id
            JOIN campuses cp ON c.campus_id = cp.id
            JOIN users u ON r.staff_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Update status of a report (pending / resolved)
     * 
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateStatus($id, $status) {
        if (!in_array($status, ['pending', 'resolved'])) {
            return false;
        }
        $stmt = $this->db->prepare("UPDATE reports SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    /**
     * Delete report by ID
     * 
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM reports WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Get report statistics (total, pending, resolved)
     * 
     * @return array
     */
    public function getStats() {
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM reports
        ");
        $res = $stmt->fetch();
        return [
            'total' => intval($res['total'] ?? 0),
            'pending' => intval($res['pending'] ?? 0),
            'resolved' => intval($res['resolved'] ?? 0)
        ];
    }
}

