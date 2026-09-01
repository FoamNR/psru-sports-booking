<?php
require_once __DIR__ . '/../models/CourtClosureModel.php';

class CourtController extends BaseController {
    private $courtModel;
    private $newsModel;
    private $bookingModel;
    private $closureModel;

    public function __construct() {
        $this->courtModel = new CourtModel();
        $this->newsModel = new NewsModel();
        $this->bookingModel = new BookingModel();
        $this->closureModel = new CourtClosureModel();
    }

    /**
     * List all courts & load announcements
     */
    public function list() {
        try {
            $courts = $this->courtModel->getAll();
            $announcement = $this->newsModel->getLatest();

            $this->json([
                'success' => true,
                'courts' => $courts,
                'announcement' => $announcement
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show court details and facilities
     */
    public function detail() {
        $courtId = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;
        if ($courtId <= 0) {
            $this->json(['success' => false, 'message' => 'Invalid Court ID'], 400);
        }

        try {
            $court = $this->courtModel->getById($courtId);
            if (!$court) {
                $this->json(['success' => false, 'message' => 'Court not found'], 404);
            }

            $facilities = $this->courtModel->getFacilities($courtId);

            $this->json([
                'success' => true,
                'court' => $court,
                'facilities' => $facilities
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Check booked slots for a court on a single date or multiple dates
     */
    public function bookedSlots() {
        $courtId = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;
        $selectedDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        $datesParam = isset($_GET['dates']) ? trim($_GET['dates']) : '';

        if ($courtId <= 0) {
            $this->json(['success' => false, 'message' => 'Invalid Court ID'], 400);
        }

        try {
            if (!empty($datesParam)) {
                $dateArray = array_filter(array_map('trim', explode(',', $datesParam)));
                $bookedByDate = [];
                foreach ($dateArray as $d) {
                    if ($d) {
                        $bookedByDate[$d] = $this->bookingModel->getBookedSlots($courtId, $d);
                    }
                }
                $closures = $this->closureModel->getClosuresForDates($courtId, $dateArray);
                $this->json([
                    'success' => true,
                    'booked_slots_by_date' => $bookedByDate,
                    'closures' => $closures
                ]);
            } else {
                $bookedSlots = $this->bookingModel->getBookedSlots($courtId, $selectedDate);
                $closures = $this->closureModel->getClosuresForDates($courtId, [$selectedDate]);
                $this->json([
                    'success' => true,
                    'booked_slots' => $bookedSlots,
                    'closures' => $closures
                ]);
            }
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
