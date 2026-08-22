<?php

class ReportModel extends BaseModel {
    /**
     * Create a maintenance/issue report for a court
     * 
     * @return bool
     */
    public function create($staffId, $courtId, $description) {
        $stmt = $this->db->prepare("INSERT INTO reports (staff_id, court_id, description, status) VALUES (?, ?, ?, 'pending')");
        return $stmt->execute([$staffId, $courtId, $description]);
    }
}
