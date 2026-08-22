<?php

class NewsModel extends BaseModel {
    /**
     * Get the latest news announcement
     * 
     * @return array|null
     */
    public function getLatest() {
        $stmt = $this->db->query("SELECT * FROM news ORDER BY created_at DESC LIMIT 1");
        return $stmt->fetch() ?: null;
    }

    /**
     * Publish a news announcement
     * 
     * @return bool
     */
    public function publish($title, $content, $adminId) {
        $stmt = $this->db->prepare("INSERT INTO news (title, content, created_by) VALUES (?, ?, ?)");
        return $stmt->execute([$title, $content, $adminId]);
    }
}
