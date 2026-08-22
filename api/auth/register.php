<?php
require_once '../../models/BaseModel.php';
require_once '../../models/UserModel.php';
require_once '../../controllers/BaseController.php';
require_once '../../controllers/AuthController.php';

$controller = new AuthController();
$controller->register();
