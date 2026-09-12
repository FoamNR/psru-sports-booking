<?php
require_once __DIR__ . '/../../models/BaseModel.php';
require_once __DIR__ . '/../../models/ReportModel.php';
require_once __DIR__ . '/../../models/CourtModel.php';
require_once __DIR__ . '/../../controllers/BaseController.php';
require_once __DIR__ . '/../../controllers/ReportController.php';

$controller = new ReportController();
$controller->list();
