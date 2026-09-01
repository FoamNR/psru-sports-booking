checkAuth('student');

// Parse query params
const urlParams = new URLSearchParams(window.location.search);
const rawCourtId = urlParams.get('court_id');
const courtId = (rawCourtId && parseInt(rawCourtId) > 0) ? parseInt(rawCourtId) : 1;
const defaultDate = urlParams.get('date');

let currentCourt = null;
let dateMode = 'single'; // 'single' or 'range'

// Helper: Format Date to YYYY-MM-DD
const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Format Thai Date display
const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Setup Booking Date picker limits (Today to Today + 30 Days)
const setupDatePickers = () => {
    const today = new Date();
    const minDateVal = formatDateStr(today);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateVal = formatDateStr(maxDate);
    
    const singleInput = document.getElementById('booking-date');
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    
    [singleInput, startInput, endInput].forEach(inp => {
        if (inp) {
            inp.min = minDateVal;
            inp.max = maxDateVal;
        }
    });
    
    const initialDate = (defaultDate && defaultDate >= minDateVal && defaultDate <= maxDateVal) ? defaultDate : minDateVal;
    if (singleInput) singleInput.value = initialDate;
    if (startInput) startInput.value = initialDate;
    if (endInput) endInput.value = initialDate;
    
    updateDatesSummary();
};

// Switch between Single Date & Date Range
function setDateMode(mode) {
    dateMode = mode;
    const btnSingle = document.getElementById('btn-mode-single');
    const btnRange = document.getElementById('btn-mode-range');
    const singleBox = document.getElementById('single-date-box');
    const rangeBox = document.getElementById('range-date-box');
    
    if (!btnSingle || !btnRange || !singleBox || !rangeBox) return;
    
    if (mode === 'single') {
        btnSingle.className = "px-3 py-1 rounded-lg bg-white text-gray-800 shadow-sm transition-all";
        btnRange.className = "px-3 py-1 rounded-lg text-gray-500 hover:text-gray-900 transition-all";
        singleBox.classList.remove('hidden');
        rangeBox.classList.add('hidden');
    } else {
        btnSingle.className = "px-3 py-1 rounded-lg text-gray-500 hover:text-gray-900 transition-all";
        btnRange.className = "px-3 py-1 rounded-lg bg-white text-gray-800 shadow-sm transition-all";
        singleBox.classList.add('hidden');
        rangeBox.classList.remove('hidden');
        
        // Ensure end date >= start date
        const startVal = document.getElementById('start-date').value;
        const endInput = document.getElementById('end-date');
        if (endInput.value < startVal) {
            endInput.value = startVal;
        }
        endInput.min = startVal;
    }
    
    updateDatesSummary();
    fetchBookedSlots();
}

// Get array of selected dates
function getSelectedDates() {
    if (dateMode === 'single') {
        const input = document.getElementById('booking-date');
        const val = input ? input.value : '';
        return val ? [val] : [];
    } else {
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        if (!startInput || !endInput) return [];
        
        const startVal = startInput.value;
        const endVal = endInput.value;
        if (!startVal || !endVal) return [];
        
        const dates = [];
        let cur = new Date(startVal);
        const end = new Date(endVal);
        
        if (cur > end) {
            return [startVal];
        }
        
        while (cur <= end) {
            dates.push(formatDateStr(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return dates;
    }
}

// Update summary text
function updateDatesSummary() {
    const dates = getSelectedDates();
    const countSpan = document.getElementById('dates-count-text');
    const rangeSpan = document.getElementById('dates-range-text');
    
    if (!countSpan || !rangeSpan) return;
    
    if (dates.length === 0) {
        countSpan.textContent = 'ยังไม่ได้เลือกวัน';
        rangeSpan.textContent = '';
        return;
    }
    
    if (dates.length === 1) {
        countSpan.textContent = `จอง 1 วัน`;
        rangeSpan.textContent = formatThaiDate(dates[0]);
    } else {
        countSpan.textContent = `จอง ${dates.length} วันต่อเนื่อง`;
        rangeSpan.textContent = `${formatThaiDate(dates[0])} - ${formatThaiDate(dates[dates.length - 1])}`;
    }
}

// 1. Fetch Court Details
async function fetchCourtDetail() {
    try {
        const response = await fetch(`api/courts/detail.php?court_id=${courtId}`);
        const result = await response.json();
        
        if (result.success) {
            currentCourt = result.court;
            const nameEl = document.getElementById('court-name');
            const descEl = document.getElementById('court-description');
            const campEl = document.getElementById('court-campus');
            const locEl = document.getElementById('court-location-type');
            const hoursEl = document.getElementById('court-operating-hours');
            
            if (nameEl) nameEl.textContent = currentCourt.name;
            if (descEl) descEl.textContent = currentCourt.description;
            if (campEl) campEl.textContent = currentCourt.campus_name;
            if (locEl) locEl.textContent = currentCourt.location_type === 'indoor' ? 'ในร่ม (Indoor)' : 'กลางแจ้ง (Outdoor)';
            
            const openHour = currentCourt.opening_time ? currentCourt.opening_time.slice(0, 5) : '08:00';
            const closeHour = currentCourt.closing_time ? currentCourt.closing_time.slice(0, 5) : '21:00';
            if (hoursEl) hoursEl.textContent = `เปิด ${openHour} - ${closeHour} น.`;
            
            // Populate Start & End time dropdowns
            populateTimeOptions(openHour, closeHour);
            
            // Render image
            const imageBox = document.getElementById('court-image-box');
            if (imageBox) {
                if (currentCourt.image_url && currentCourt.image_url !== 'mock_image.jpg' && currentCourt.image_url !== 'default_court.jpg') {
                    imageBox.innerHTML = `
                        <img src="uploads/courts/${currentCourt.image_url}" alt="${currentCourt.name}" class="w-full h-full object-cover">
                        <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-medium flex items-center">
                            <i data-lucide="camera" class="w-3.5 h-3.5 mr-1"></i> ภาพจริงสถานที่เล่นกีฬา
                        </div>
                    `;
                } else {
                    let icon = 'dribbble';
                    if (currentCourt.sport_type === 'badminton') icon = 'activity';
                    else if (currentCourt.sport_type === 'football') icon = 'circle-dot';
                    else if (currentCourt.sport_type === 'tennis') icon = 'target';
                    else if (currentCourt.sport_type === 'basketball') icon = 'target';
                    
                    imageBox.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-psruGreen">
                            <i data-lucide="${icon}" class="w-24 h-24 opacity-25 animate-pulse"></i>
                        </div>
                        <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-medium flex items-center">
                            <i data-lucide="camera" class="w-3.5 h-3.5 mr-1"></i> ภาพจำลองสนามกีฬา
                        </div>
                    `;
                }
            }
            
            // Render facilities
            const facilitiesBox = document.getElementById('court-facilities');
            if (facilitiesBox) {
                facilitiesBox.innerHTML = '';
                if (result.facilities && result.facilities.length > 0) {
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
            }
            
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) {
        console.error('fetchCourtDetail error', e);
    }
}

// Populate Start and End Time dropdowns
function populateTimeOptions(openStr = '08:00', closeStr = '21:00') {
    const startSelect = document.getElementById('start-time-select');
    const endSelect = document.getElementById('end-time-select');
    
    if (!startSelect || !endSelect) return;
    
    const prevStart = startSelect.value || '17:00';
    const prevEnd = endSelect.value || '19:00';
    
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';
    
    const [openH, openM] = openStr.split(':').map(Number);
    const [closeH, closeM] = closeStr.split(':').map(Number);
    
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);
    
    // Generate 30-minute intervals for Start Time
    for (let m = openMinutes; m < closeMinutes; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeVal = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        startSelect.insertAdjacentHTML('beforeend', `<option value="${timeVal}">${timeVal} น.</option>`);
    }
    
    // Generate 30-minute intervals for End Time
    for (let m = openMinutes + 30; m <= closeMinutes; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeVal = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        endSelect.insertAdjacentHTML('beforeend', `<option value="${timeVal}">${timeVal} น.</option>`);
    }
    
    // Restore previous selection or use sensible default
    if (startSelect.querySelector(`option[value="${prevStart}"]`)) {
        startSelect.value = prevStart;
    } else if (startSelect.options.length > 0) {
        startSelect.selectedIndex = 0;
    }
    
    if (endSelect.querySelector(`option[value="${prevEnd}"]`)) {
        endSelect.value = prevEnd;
    } else if (endSelect.options.length > 0) {
        endSelect.selectedIndex = Math.min(2, endSelect.options.length - 1);
    }
    
    updateTimeDuration();
}

// Calculate and update duration badge
function updateTimeDuration() {
    const startSelect = document.getElementById('start-time-select');
    const endSelect = document.getElementById('end-time-select');
    const durationText = document.getElementById('duration-text');
    const durationRangeText = document.getElementById('duration-range-text');
    const durationBadge = document.getElementById('duration-badge');
    
    if (!startSelect || !endSelect || !durationText || !durationBadge) return;
    
    const startTime = startSelect.value;
    const endTime = endSelect.value;
    
    if (!startTime || !endTime) return;
    
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    const diff = endMin - startMin;
    
    if (diff <= 0) {
        durationBadge.className = "bg-red-50 text-red-600 font-bold px-3 py-2 rounded-xl flex items-center justify-between border border-red-100 text-xs";
        durationText.textContent = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น";
        if (durationRangeText) durationRangeText.textContent = "";
        return;
    }
    
    durationBadge.className = "bg-green-50 text-psruGreen font-bold px-3 py-2 rounded-xl flex items-center justify-between border border-green-100 text-xs";
    
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    let label = 'ระยะเวลา: ';
    if (hours > 0) label += `${hours} ชั่วโมง `;
    if (mins > 0) label += `${mins} นาที`;
    
    durationText.textContent = label.trim();
    if (durationRangeText) {
        durationRangeText.textContent = `${startTime} - ${endTime} น.`;
    }
}

// Quick Preset handler
function setQuickTime(start, end) {
    const startSelect = document.getElementById('start-time-select');
    const endSelect = document.getElementById('end-time-select');
    
    if (!startSelect || !endSelect) return;
    
    if (startSelect.querySelector(`option[value="${start}"]`)) {
        startSelect.value = start;
    }
    if (endSelect.querySelector(`option[value="${end}"]`)) {
        endSelect.value = end;
    }
    
    updateTimeDuration();
}

// 2. Fetch Busy Slots for selected date(s)
async function fetchBookedSlots() {
    const dates = getSelectedDates();
    const container = document.getElementById('occupied-slots-container');
    
    if (!container) return;
    
    if (dates.length === 0) {
        container.innerHTML = `<span class="text-gray-400 text-[11px]">กรุณาเลือกวันที่ก่อน</span>`;
        return;
    }
    
    container.innerHTML = `<span class="text-gray-400 text-[11px] flex items-center"><i data-lucide="loader-2" class="w-3 h-3 animate-spin mr-1"></i> กำลังตรวจสอบคิว...</span>`;
    if (window.lucide) lucide.createIcons();
    
    try {
        const datesParam = dates.join(',');
        const response = await fetch(`api/courts/booked-slots.php?court_id=${courtId}&dates=${datesParam}`);
        const result = await response.json();
        
        container.innerHTML = '';
        
        let allBooked = [];
        if (result.booked_slots_by_date) {
            for (const [d, slots] of Object.entries(result.booked_slots_by_date)) {
                slots.forEach(s => {
                    allBooked.push({
                        date: d,
                        start: s.start_time.slice(0, 5),
                        end: s.end_time.slice(0, 5)
                    });
                });
            }
        } else if (result.booked_slots) {
            result.booked_slots.forEach(s => {
                allBooked.push({
                    date: dates[0],
                    start: s.start_time.slice(0, 5),
                    end: s.end_time.slice(0, 5)
                });
            });
        }
        
        if (allBooked.length === 0) {
            container.innerHTML = `
                <span class="inline-flex items-center text-[11px] text-green-700 bg-green-50 px-2.5 py-1 rounded-lg font-medium border border-green-100">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5 mr-1 text-psruGreen"></i>
                    สนามว่างตลอดวัน (ยังไม่มีการจอง)
                </span>
            `;
        } else {
            allBooked.forEach(slot => {
                const dateLabel = dates.length > 1 ? `(${formatThaiDate(slot.date)}) ` : '';
                container.insertAdjacentHTML('beforeend', `
                    <span class="inline-flex items-center text-[10px] text-red-600 bg-red-50 px-2.5 py-1 rounded-lg font-semibold border border-red-100">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                        ${dateLabel}${slot.start} - ${slot.end} น. (ติดจอง)
                    </span>
                `);
            });
        }
        
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        container.innerHTML = `<span class="text-[11px] text-red-500">เกิดข้อผิดพลาดในการโหลดคิว</span>`;
    }
}

// Setup Event Listeners
function bindEvents() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-btn');
            const alertBox = document.getElementById('error-alert');
            const dates = getSelectedDates();
            const startSelect = document.getElementById('start-time-select');
            const endSelect = document.getElementById('end-time-select');
            const titleInput = document.getElementById('booking-title');
            const reqInput = document.getElementById('additional-request');
            
            const startTime = startSelect ? startSelect.value : '';
            const endTime = endSelect ? endSelect.value : '';
            const bookingTitle = titleInput ? titleInput.value.trim() : '';
            const additionalRequest = reqInput ? reqInput.value.trim() : '';
            
            if (dates.length === 0) {
                if (alertBox) {
                    alertBox.querySelector('#error-alert-text').textContent = "กรุณาเลือกวันที่ต้องการเข้าใช้บริการครับ";
                    alertBox.classList.remove('hidden');
                }
                return;
            }
            
            if (!startTime || !endTime || startTime >= endTime) {
                if (alertBox) {
                    alertBox.querySelector('#error-alert-text').textContent = "กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุดให้ถูกต้อง (เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น)";
                    alertBox.classList.remove('hidden');
                }
                return;
            }

            if (!bookingTitle) {
                if (alertBox) {
                    alertBox.querySelector('#error-alert-text').textContent = "กรุณากรอกหัวข้อหรือวัตถุประสงค์การจองสนามครับ (จำเป็นต้องระบุ)";
                    alertBox.classList.remove('hidden');
                }
                if (titleInput) titleInput.focus();
                return;
            }
            
            if (alertBox) alertBox.classList.add('hidden');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `⏳ กำลังทำรายการจอง...`;
            }
            
            try {
                const payload = {
                    court_id: courtId,
                    booking_dates: dates,
                    start_time: startTime,
                    end_time: endTime,
                    booking_title: bookingTitle,
                    additional_request: additionalRequest
                };
                
                const response = await fetch('api/bookings/create.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(result.message);
                    window.location.href = 'my-bookings.html';
                } else {
                    if (alertBox) {
                        alertBox.querySelector('#error-alert-text').textContent = result.message;
                        alertBox.classList.remove('hidden');
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อตกลงและส่งใบจอง</span>`;
                    }
                    if (window.lucide) lucide.createIcons();
                }
            } catch (err) {
                if (alertBox) {
                    alertBox.querySelector('#error-alert-text').textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
                    alertBox.classList.remove('hidden');
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อตกลงและส่งใบจอง</span>`;
                }
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    const bookingDateInput = document.getElementById('booking-date');
    if (bookingDateInput) {
        bookingDateInput.addEventListener('change', () => {
            updateDatesSummary();
            fetchBookedSlots();
        });
    }

    const startDateInput = document.getElementById('start-date');
    if (startDateInput) {
        startDateInput.addEventListener('change', (e) => {
            const endInput = document.getElementById('end-date');
            if (endInput && endInput.value < e.target.value) {
                endInput.value = e.target.value;
            }
            if (endInput) endInput.min = e.target.value;
            updateDatesSummary();
            fetchBookedSlots();
        });
    }

    const endDateInput = document.getElementById('end-date');
    if (endDateInput) {
        endDateInput.addEventListener('change', () => {
            updateDatesSummary();
            fetchBookedSlots();
        });
    }

    const startSelect = document.getElementById('start-time-select');
    if (startSelect) {
        startSelect.addEventListener('change', () => {
            const startVal = startSelect.value;
            const endSelect = document.getElementById('end-time-select');
            if (endSelect && endSelect.value <= startVal) {
                for (let opt of endSelect.options) {
                    if (opt.value > startVal) {
                        endSelect.value = opt.value;
                        break;
                    }
                }
            }
            updateTimeDuration();
        });
    }

    const endSelect = document.getElementById('end-time-select');
    if (endSelect) {
        endSelect.addEventListener('change', updateTimeDuration);
    }
}

// Master Initialization
async function init() {
    setupDatePickers();
    populateTimeOptions('08:00', '21:00');
    bindEvents();
    await fetchCourtDetail();
    await fetchBookedSlots();
    await loadLayout();
    if (window.lucide) lucide.createIcons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
