<?php
require_once '../../models/BaseModel.php';
require_once '../../models/BookingModel.php';
require_once '../../models/CourtModel.php';
require_once '../../models/ReportModel.php';
require_once '../../controllers/BaseController.php';
require_once '../../controllers/StaffController.php';

$controller = new StaffController();
$controller->dashboard();
