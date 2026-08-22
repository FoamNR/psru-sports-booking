<?php

class CampusModel extends BaseModel {
    /**
     * Get all campuses
     * 
     * @return array
     */
    public function getAll() {
        $stmt = $this->db->query("SELECT * FROM campuses");
        return $stmt->fetchAll();
    }
}
