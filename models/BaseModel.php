<?php

class BaseModel {
    /**
     * @var PDO
     */
    protected $db;

    public function __construct() {
        global $pdo;
        if (!isset($pdo)) {
            require_once __DIR__ . '/../config/db.php';
        }
        $this->db = $pdo;
    }
}
