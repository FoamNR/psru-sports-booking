<?php
require_once '../../models/BaseModel.php';
require_once '../../models/UserModel.php';
require_once '../../models/CourtModel.php';
require_once '../../models/CampusModel.php';
require_once '../../models/NewsModel.php';
require_once '../../controllers/BaseController.php';
require_once '../../controllers/AdminController.php';

$controller = new AdminController();
$controller->dashboard();
