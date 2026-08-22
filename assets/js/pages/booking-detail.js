checkAuth('student');
loadLayout();

// Parse query params
const urlParams = new URLSearchParams(window.location.search);
const courtId = parseInt(urlParams.get('court_id') || 1);
const defaultDate = urlParams.get('date');

// Dynamic Date Generation (Today + 2 Days)
const generateBookingDates = () => {
    const select = document.getElementById('booking-date');
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    let defaultSelected = false;
    for (let i = 0; i < 3; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        let label = '';
        if (i === 0) label = `วันนี้ (วัน${dayNames[targetDate.getDay()]})`;
        else if (i === 1) label = `พรุ่งนี้ (วัน${dayNames[targetDate.getDay()]})`;
        else label = `วัน${dayNames[targetDate.getDay()]}ที่ ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
        
        const value = targetDate.toISOString().split('T')[0];
        const opt = document.createElement('option');
        opt.value = value;
        opt.innerText = label;
        
        if (defaultDate === value) {
            opt.selected = true;
            defaultSelected = true;
        }
        
        select.appendChild(opt);
    }
};

generateBookingDates();

// 1. Fetch Court Specs
async function fetchCourtDetail() {
    try {
        const response = await fetch(`api/courts/detail.php?court_id=${courtId}`);
        const result = await response.json();
        
        if (result.success) {
            const court = result.court;
            document.getElementById('court-name').textContent = court.name;
            document.getElementById('court-description').textContent = court.description;
            document.getElementById('court-campus').textContent = court.campus_name;
            document.getElementById('court-location-type').textContent = court.location_type === 'indoor' ? 'ในร่ม (Indoor)' : 'กลางแจ้ง (Outdoor)';
            
            // Render image
            const imageBox = document.getElementById('court-image-box');
            if (court.image_url && court.image_url !== 'mock_image.jpg' && court.image_url !== 'default_court.jpg') {
                imageBox.innerHTML = `
                    <img src="uploads/courts/${court.image_url}" alt="${court.name}" class="w-full h-full object-cover">
                    <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-medium flex items-center">
                        <i data-lucide="camera" class="w-3.5 h-3.5 mr-1"></i> ภาพจริงสถานที่เล่นกีฬา
                    </div>
                `;
            } else {
                let icon = 'dribbble';
                if (court.sport_type === 'badminton') icon = 'activity';
                else if (court.sport_type === 'football') icon = 'circle-dot';
                else if (court.sport_type === 'tennis') icon = 'target';
                else if (court.sport_type === 'basketball') icon = 'target';
                
                imageBox.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-psruGreen">
                        <i data-lucide="${icon}" class="w-24 h-24 opacity-25 animate-pulse"></i>
                    </div>
                    <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-medium flex items-center">
                        <i data-lucide="camera" class="w-3.5 h-3.5 mr-1"></i> ภาพจำลองสนามกีฬา
                    </div>
                `;
            }
            
            // Render facilities
            const facilitiesBox = document.getElementById('court-facilities');
            facilitiesBox.innerHTML = '';
            if (result.facilities.length > 0) {
                result.facilities.forEach(fac => {
                    facilitiesBox.insertAdjacentHTML('beforeend', `
                        <div class="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <i data-lucide="zap" class="w-4 h-4 text-psruGreen"></i>
                            <span>${fac}</span>
                        </div>
                    `);
                });
            } else {
                facilitiesBox.innerHTML = '<p class="text-xs text-gray-400">ไม่มีสิ่งอำนวยความสะดวกระบุไว้</p>';
            }
            
            // Refresh Lucide Icons
            lucide.createIcons();
        }
    } catch (e) {
        console.error(e);
    }
}

// 2. Fetch Busy Slots
async function fetchBookedSlots() {
    const date = document.getElementById('booking-date').value;
    const container = document.getElementById('time-slots-container');
    container.innerHTML = `<p class="col-span-2 text-center text-xs text-gray-400 py-3">กำลังค้นหารอบเวลาว่าง...</p>`;
    
    // Clear selection input
    document.getElementById('selected-timeslot').value = '';
    
    try {
        const response = await fetch(`api/courts/booked-slots.php?court_id=${courtId}&date=${date}`);
        const result = await response.json();
        
        if (result.success) {
            // Extract start times of booked slots
            const busyTimes = result.booked_slots.map(s => s.start_time);
            
            const slots = [
                { label: '16:00 - 17:00', val: '16:00:00' },
                { label: '17:00 - 18:00', val: '17:00:00' },
                { label: '18:00 - 19:00', val: '18:00:00' },
                { label: '19:00 - 20:00', val: '19:00:00' }
            ];
            
            container.innerHTML = '';
            
            slots.forEach(slot => {
                const isBooked = busyTimes.includes(slot.val);
                if (isBooked) {
                    container.insertAdjacentHTML('beforeend', `
                        <button type="button" class="slot-btn border border-gray-200 rounded-xl py-2 px-3 text-center text-xs font-medium bg-gray-50 text-gray-400 cursor-not-allowed flex items-center justify-center space-x-1" disabled>
                            <span>${slot.label}</span>
                            <span class="text-[9px] bg-gray-200 text-gray-500 px-1 rounded">เต็ม</span>
                        </button>
                    `);
                } else {
                    container.insertAdjacentHTML('beforeend', `
                        <button type="button" onclick="selectSlot(this, '${slot.label}')" class="slot-btn border border-gray-200 hover:border-psruGreen rounded-xl py-2 px-3 text-center text-xs font-semibold bg-white text-gray-700 transition-all focus:outline-none">
                            ${slot.label}
                        </button>
                    `);
                }
            });
        }
    } catch (e) {
        container.innerHTML = `<p class="col-span-2 text-center text-xs text-red-500 py-3">เกิดข้อผิดพลาดในการโหลดคิว</p>`;
    }
}

// Slot selection toggle
function selectSlot(button, label) {
    // Remove active classes from all slot buttons
    const btns = document.querySelectorAll('.slot-btn');
    btns.forEach(btn => {
        if(!btn.disabled) {
            btn.className = "slot-btn border border-gray-200 hover:border-psruGreen rounded-xl py-2 px-3 text-center text-xs font-semibold bg-white text-gray-700 transition-all focus:outline-none";
        }
    });
    
    // Set active style for selected button
    button.className = "slot-btn border-2 border-psruGreen rounded-xl py-2 px-3 text-center text-xs font-bold bg-green-50 text-psruGreen transition-all focus:outline-none shadow-sm";
    document.getElementById('selected-timeslot').value = label;
}

// Handle Booking submit
document.getElementById('booking-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const alertBox = document.getElementById('error-alert');
    const timeslot = document.getElementById('selected-timeslot').value;
    
    if(!timeslot) {
        alertBox.querySelector('#error-alert-text').textContent = "กรุณาคลิกเลือกรอบเวลาที่ต้องการเข้าใช้บริการกีฬาครับ";
        alertBox.classList.remove('hidden');
        return;
    }
    
    alertBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ กำลังทำรายการจอง...`;
    
    try {
        const response = await fetch('api/bookings/create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                court_id: courtId,
                booking_date: document.getElementById('booking-date').value,
                time_slot: timeslot,
                additional_request: document.getElementById('additional-request').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Success, redirect to my bookings list
            window.location.href = 'my-bookings.html';
        } else {
            alertBox.querySelector('#error-alert-text').textContent = result.message;
            alertBox.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อตกลงและส่งใบจอง</span>`;
            lucide.createIcons();
        }
    } catch (err) {
        alertBox.querySelector('#error-alert-text').textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        alertBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อตกลงและส่งใบจอง</span>`;
        lucide.createIcons();
    }
});

// Bind date change event to search slots
document.getElementById('booking-date').addEventListener('change', fetchBookedSlots);

// Initialize layouts
window.addEventListener('DOMContentLoaded', async () => {
    await fetchCourtDetail();
    await fetchBookedSlots();
    await loadLayout();
});
