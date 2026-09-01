<?php
require_once __DIR__ . '/../../models/BaseModel.php';
require_once __DIR__ . '/../../models/CourtModel.php';
require_once __DIR__ . '/../../models/CourtClosureModel.php';
require_once __DIR__ . '/../../controllers/BaseController.php';
require_once __DIR__ . '/../../controllers/CourtClosureController.php';

$controller = new CourtClosureController();
$controller->create();
