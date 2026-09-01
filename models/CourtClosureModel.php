<?php
require_once __DIR__ . '/BaseModel.php';

class CourtClosureModel extends BaseModel {

    /**
     * Get all closures with court and creator information
     * 
     * @return array
     */
    public function getAll() {
        $stmt = $this->db->query("
            SELECT cc.*, 
                   c.name AS court_name, 
                   c.sport_type,
                   cp.name AS campus_name,
                   u.first_name AS creator_first,
                   u.last_name AS creator_last,
                   u.role AS creator_role
            FROM court_closures cc
            JOIN courts c ON cc.court_id = c.id
            JOIN campuses cp ON c.campus_id = cp.id
            JOIN users u ON cc.created_by = u.id
            ORDER BY cc.start_date DESC, cc.id DESC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Get active and upcoming closures
     * 
     * @param int|null $courtId
     * @return array
     */
    public function getActiveAndUpcoming($courtId = null) {
        $today = date('Y-m-d');
        if ($courtId) {
            $stmt = $this->db->prepare("
                SELECT cc.*, 
                       c.name AS court_name, 
                       c.sport_type,
                       cp.name AS campus_name,
                       u.first_name AS creator_first,
                       u.last_name AS creator_last
                FROM court_closures cc
                JOIN courts c ON cc.court_id = c.id
                JOIN campuses cp ON c.campus_id = cp.id
                JOIN users u ON cc.created_by = u.id
                WHERE cc.court_id = ? AND cc.end_date >= ?
                ORDER BY cc.start_date ASC
            ");
            $stmt->execute([$courtId, $today]);
        } else {
            $stmt = $this->db->prepare("
                SELECT cc.*, 
                       c.name AS court_name, 
                       c.sport_type,
                       cp.name AS campus_name,
                       u.first_name AS creator_first,
                       u.last_name AS creator_last
                FROM court_closures cc
                JOIN courts c ON cc.court_id = c.id
                JOIN campuses cp ON c.campus_id = cp.id
                JOIN users u ON cc.created_by = u.id
                WHERE cc.end_date >= ?
                ORDER BY cc.start_date ASC
            ");
            $stmt->execute([$today]);
        }
        return $stmt->fetchAll();
    }

    /**
     * Get closures for specific date(s) for a court
     * 
     * @param int $courtId
     * @param array $dates
     * @return array
     */
    public function getClosuresForDates($courtId, array $dates) {
        if (empty($dates)) return [];
        
        $placeholders = implode(',', array_fill(0, count($dates), '?'));
        
        // Find any closure whose [start_date, end_date] covers any of the given dates
        $sql = "
            SELECT cc.*, c.name AS court_name
            FROM court_closures cc
            JOIN courts c ON cc.court_id = c.id
            WHERE cc.court_id = ?
              AND (
        ";
        
        $conditions = [];
        $params = [$courtId];
        foreach ($dates as $d) {
            $conditions[] = "(cc.start_date <= ? AND cc.end_date >= ?)";
            $params[] = $d;
            $params[] = $d;
        }
        
        $sql .= implode(' OR ', $conditions) . ") ORDER BY cc.start_date ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Check if court is closed during a specific date and time interval
     * 
     * @param int $courtId
     * @param string $date (YYYY-MM-DD)
     * @param string $startTime (HH:MM:SS or HH:MM)
     * @param string $endTime (HH:MM:SS or HH:MM)
     * @return array|false Returns closure details if closed, false if open
     */
    public function isCourtClosed($courtId, $date, $startTime, $endTime) {
        $stmt = $this->db->prepare("
            SELECT * FROM court_closures
            WHERE court_id = ?
              AND start_date <= ? AND end_date >= ?
              AND (
                  (start_time IS NULL OR end_time IS NULL)
                  OR (start_time < ? AND end_time > ?)
              )
            LIMIT 1
        ");
        $stmt->execute([$courtId, $date, $date, $endTime, $startTime]);
        return $stmt->fetch();
    }

    /**
     * Create a new court closure
     * 
     * @param int $courtId
     * @param string $startDate
     * @param string $endDate
     * @param string|null $startTime
     * @param string|null $endTime
     * @param string $reason
     * @param int $createdBy
     * @return bool
     */
    public function create($courtId, $startDate, $endDate, $startTime, $endTime, $reason, $createdBy) {
        $stmt = $this->db->prepare("
            INSERT INTO court_closures (court_id, start_date, end_date, start_time, end_time, reason, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $courtId,
            $startDate,
            $endDate,
            $startTime ?: null,
            $endTime ?: null,
            $reason,
            $createdBy
        ]);
    }

    /**
     * Delete a court closure
     * 
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM court_closures WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Get a closure by ID
     * 
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM court_closures WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
