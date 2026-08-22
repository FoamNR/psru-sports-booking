<?php

class UserModel extends BaseModel {
    /**
     * Get user by ID
     * 
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get user by username
     * 
     * @param string $username
     * @return array|false
     */
    public function getByUsername($username) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        return $stmt->fetch();
    }

    /**
     * Check if username exists
     * 
     * @param string $username
     * @return bool
     */
    public function isUsernameExists($username) {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Create user
     * 
     * @return bool
     */
    public function create($username, $passwordHash, $firstName, $lastName, $email, $phone, $role, $status) {
        $stmt = $this->db->prepare("
            INSERT INTO users (username, password_hash, first_name, last_name, email, phone, role, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $username,
            $passwordHash,
            $firstName,
            $lastName,
            $email,
            $phone,
            $role,
            $status
        ]);
    }

    /**
     * Get all users except specified ID (usually current admin)
     * 
     * @param int $excludeId
     * @return array
     */
    public function getAllExcept($excludeId) {
        $stmt = $this->db->prepare("SELECT id, username, first_name, last_name, email, phone, role, status FROM users WHERE id != ? ORDER BY id DESC");
        $stmt->execute([$excludeId]);
        return $stmt->fetchAll();
    }

    /**
     * Update user details
     * 
     * @return bool
     */
    public function update($id, $firstName, $lastName, $email, $phone, $role, $status, $passwordHash = null) {
        if ($passwordHash !== null) {
            $stmt = $this->db->prepare("
                UPDATE users 
                SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, status = ?, password_hash = ? 
                WHERE id = ?
            ");
            return $stmt->execute([$firstName, $lastName, $email, $phone, $role, $status, $passwordHash, $id]);
        } else {
            $stmt = $this->db->prepare("
                UPDATE users 
                SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, status = ? 
                WHERE id = ?
            ");
            return $stmt->execute([$firstName, $lastName, $email, $phone, $role, $status, $id]);
        }
    }

    /**
     * Toggle status between normal and suspended
     * 
     * @param int $id
     * @return string|false New status or false on failure
     */
    public function toggleStatus($id) {
        $user = $this->getById($id);
        if (!$user) {
            return false;
        }
        $newStatus = ($user['status'] === 'normal') ? 'suspended' : 'normal';
        $stmt = $this->db->prepare("UPDATE users SET status = ? WHERE id = ?");
        if ($stmt->execute([$newStatus, $id])) {
            return $newStatus;
        }
        return false;
    }

    /**
     * Delete user by ID
     * 
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
