<?php

class BaseController {
    /**
     * Send JSON response and exit
     * 
     * @param array $data
     * @param int $statusCode
     */
    protected function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }

    /**
     * Retrieve input variables (JSON or POST)
     * 
     * @return array
     */
    protected function getInput() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }
        return $input ?: [];
    }

    /**
     * Start session if not started
     */
    protected function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * Check if user is logged in and matches the expected role(s)
     * 
     * @param string|array $allowedRoles
     */
    protected function checkRole($allowedRoles) {
        $this->startSession();
        if (!isset($_SESSION['user_id'])) {
            $this->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $allowed = (array)$allowedRoles;
        if (!in_array($_SESSION['role'], $allowed)) {
            $this->json(['success' => false, 'message' => 'Forbidden'], 403);
        }
    }
}
