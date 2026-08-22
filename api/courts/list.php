<?php
require_once '../../models/BaseModel.php';
require_once '../../models/BookingModel.php';
require_once '../../models/CourtModel.php';
require_once '../../models/NewsModel.php';
require_once '../../controllers/BaseController.php';
require_once '../../controllers/CourtController.php';

$controller = new CourtController();
$controller->list();
