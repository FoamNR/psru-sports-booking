<?php

class CourtController extends BaseController {
    private $courtModel;
    private $newsModel;
    private $bookingModel;

    public function __construct() {
        $this->courtModel = new CourtModel();
        $this->newsModel = new NewsModel();
        $this->bookingModel = new BookingModel();
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
     * Get details and facilities for a court
     */
    public function detail() {
        $courtId = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;

        if ($courtId <= 0) {
            $this->json(['success' => false, 'message' => 'Invalid Court ID'], 400);
        }

        try {
            $court = $this->courtModel->getById($courtId);
            
            if (!$court) {
                $this->json(['success' => false, 'message' => 'Court Not Found'], 404);
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
     * Check booked slots for a court on a date
     */
    public function bookedSlots() {
        $courtId = isset($_GET['court_id']) ? intval($_GET['court_id']) : 0;
        $selectedDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

        if ($courtId <= 0) {
            $this->json(['success' => false, 'message' => 'Invalid Court ID'], 400);
        }

        try {
            $bookedSlots = $this->bookingModel->getBookedSlots($courtId, $selectedDate);
            $this->json([
                'success' => true,
                'booked_slots' => $bookedSlots
            ]);
        } catch (PDOException $e) {
            $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
