<?php
require_once '../../config/Database.php';
require_once '../../controllers/CourtClosureController.php';

$controller = new CourtClosureController();
$controller->list();
