<?php

class CourtModel extends BaseModel {
    /**
     * Get all courts (optionally ordered by ID desc)
     * 
     * @param bool $orderByIdDesc
     * @return array
     */
    public function getAll($orderByIdDesc = false) {
        $sql = "
            SELECT c.*, cam.name AS campus_name, cam.id AS campus_id_val, ci.image_url 
            FROM courts c 
            JOIN campuses cam ON c.campus_id = cam.id
            LEFT JOIN court_images ci ON c.id = ci.court_id AND ci.is_primary = 1
        ";
        if ($orderByIdDesc) {
            $sql .= " ORDER BY c.id DESC";
        }
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    /**
     * Get single court details
     * 
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $stmt = $this->db->prepare("
            SELECT c.*, cam.name AS campus_name, ci.image_url 
            FROM courts c 
            JOIN campuses cam ON c.campus_id = cam.id 
            LEFT JOIN court_images ci ON c.id = ci.court_id AND ci.is_primary = 1
            WHERE c.id = ? LIMIT 1
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get facilities of a court
     * 
     * @param int $courtId
     * @return array List of facility names
     */
    public function getFacilities($courtId) {
        $stmt = $this->db->prepare("SELECT facility_name FROM court_facilities WHERE court_id = ?");
        $stmt->execute([$courtId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Delete court
     * 
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM courts WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Create court (transaction)
     * 
     * @return int Created Court ID
     * @throws Exception on PDO error
     */
    public function create($campusId, $name, $sportType, $description, $locationType, $openingTime, $closingTime, $maxBookingHours, $imageName, $facilities) {
        try {
            $this->db->beginTransaction();
            
            $stmt = $this->db->prepare("
                INSERT INTO courts (campus_id, name, sport_type, description, location_type, status, opening_time, closing_time, max_booking_hours_per_day) 
                VALUES (?, ?, ?, ?, ?, 'ready', ?, ?, ?)
            ");
            $stmt->execute([
                $campusId,
                $name,
                $sportType,
                $description,
                $locationType,
                $openingTime,
                $closingTime,
                $maxBookingHours
            ]);
            $courtId = $this->db->lastInsertId();
            
            if (!empty($facilities) && is_array($facilities)) {
                $fac_stmt = $this->db->prepare("INSERT INTO court_facilities (court_id, facility_name) VALUES (?, ?)");
                foreach ($facilities as $facility) {
                    $fac_stmt->execute([$courtId, $facility]);
                }
            }
            
            $img_stmt = $this->db->prepare("INSERT INTO court_images (court_id, image_url, is_primary) VALUES (?, ?, 1)");
            $img_stmt->execute([$courtId, $imageName]);
            
            $this->db->commit();
            return $courtId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Update court (transaction)
     * 
     * @return bool
     * @throws Exception on PDO error
     */
    public function update($id, $campusId, $name, $sportType, $description, $locationType, $openingTime, $closingTime, $maxBookingHours, $newImageName = null, $facilities = []) {
        try {
            $this->db->beginTransaction();
            
            $stmt = $this->db->prepare("
                UPDATE courts 
                SET campus_id = ?, name = ?, sport_type = ?, description = ?, location_type = ?, opening_time = ?, closing_time = ?, max_booking_hours_per_day = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $campusId,
                $name,
                $sportType,
                $description,
                $locationType,
                $openingTime,
                $closingTime,
                $maxBookingHours,
                $id
            ]);
            
            $delete_facs = $this->db->prepare("DELETE FROM court_facilities WHERE court_id = ?");
            $delete_facs->execute([$id]);
            
            if (!empty($facilities) && is_array($facilities)) {
                $insert_fac = $this->db->prepare("INSERT INTO court_facilities (court_id, facility_name) VALUES (?, ?)");
                foreach ($facilities as $facility) {
                    $insert_fac->execute([$id, $facility]);
                }
            }
            
            if (!empty($newImageName)) {
                $img_check = $this->db->prepare("SELECT COUNT(*) FROM court_images WHERE court_id = ? AND is_primary = 1");
                $img_check->execute([$id]);
                
                if ($img_check->fetchColumn() > 0) {
                    $update_img = $this->db->prepare("UPDATE court_images SET image_url = ? WHERE court_id = ? AND is_primary = 1");
                    $update_img->execute([$newImageName, $id]);
                } else {
                    $insert_img = $this->db->prepare("INSERT INTO court_images (court_id, image_url, is_primary) VALUES (?, ?, 1)");
                    $insert_img->execute([$id, $newImageName]);
                }
            }
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Update court status (ready, maintenance, closed)
     * 
     * @return bool
     */
    public function updateStatus($id, $status) {
        $stmt = $this->db->prepare("UPDATE courts SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
