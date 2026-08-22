<?php
require_once '../../models/BaseModel.php';
require_once '../../models/BookingModel.php';
require_once '../../controllers/BaseController.php';
require_once '../../controllers/BookingController.php';

$controller = new BookingController();
$controller->create();
