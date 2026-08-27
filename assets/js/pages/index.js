// Check student role authentication
checkAuth('student');

// Dynamic Date Generation (Today + 2 Days)
const generateBookingDates = () => {
    const select = document.getElementById('filter-date');
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    for (let i = 0; i < 3; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        let label = '';
        if (i === 0) label = `วันนี้ (วัน${dayNames[targetDate.getDay()]})`;
        else if (i === 1) label = `พรุ่งนี้ (วัน${dayNames[targetDate.getDay()]})`;
        else label = `วัน${dayNames[targetDate.getDay()]}ที่ ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
        
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const value = `${year}-${month}-${day}`;
        const opt = document.createElement('option');
        opt.value = value;
        opt.innerText = label;
        select.appendChild(opt);
    }
};

generateBookingDates();

// API Fetch and rendering
let globalCourts = [];

async function fetchCourts() {
    try {
        const response = await fetch('api/courts/list.php');
        const result = await response.json();
        
        if (result.success) {
            globalCourts = result.courts;
            
            // Show announcement banner if available
            if (result.announcement) {
                document.getElementById('announcement-banner').classList.remove('hidden');
                document.getElementById('announcement-text').innerHTML = `<strong>${result.announcement.title}</strong> - ${result.announcement.content}`;
            }
            
            renderCourts(globalCourts);
        }
    } catch (e) {
        console.error('Failed to load courts API', e);
    }
}

function renderCourts(courts) {
    const grid = document.getElementById('courts-grid');
    const countLabel = document.getElementById('results-count');
    
    grid.innerHTML = '';
    countLabel.textContent = `พบทั้งหมด ${courts.length} สนาม`;
    
    if (courts.length === 0) {
        document.getElementById('no-results').classList.remove('hidden');
        return;
    } else {
        document.getElementById('no-results').classList.add('hidden');
    }
    
    courts.forEach(court => {
        let status_text = 'ว่างวันนี้';
        let badge_class = 'bg-green-50 text-psruGreen border-green-100';
        let btn_text = 'จองสิทธิ์ฟรี';
        let btn_class = 'bg-psruGreen hover:bg-green-700 text-white';
        let btn_disabled = '';
        
        if (court.status === 'maintenance') {
            status_text = 'ปรับปรุงชั่วคราว';
            badge_class = 'bg-amber-50 text-amber-600 border-amber-100';
            btn_text = 'งดใช้บริการ';
            btn_class = 'bg-gray-100 text-gray-400 cursor-not-allowed';
            btn_disabled = 'disabled';
        } else if (court.status === 'closed') {
            status_text = 'ปิดบริการ';
            badge_class = 'bg-red-50 text-red-600 border-red-100';
            btn_text = 'ปิดบริการ';
            btn_class = 'bg-gray-100 text-gray-400 cursor-not-allowed';
            btn_disabled = 'disabled';
        }
        
        let icon = 'dribbble';
        if (court.sport_type === 'badminton') icon = 'activity';
        else if (court.sport_type === 'football') icon = 'circle-dot';
        else if (court.sport_type === 'tennis') icon = 'target';
        else if (court.sport_type === 'basketball') icon = 'target';
        
        const imageTag = court.image_url && court.image_url !== 'mock_image.jpg' && court.image_url !== 'default_court.jpg'
            ? `<img src="uploads/courts/${court.image_url}" alt="${court.name}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-psruGreen">
                   <i data-lucide="${icon}" class="w-14 h-14 opacity-30"></i>
               </div>`;

        const cardHtml = `
            <div class="court-card bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
                <div class="h-44 bg-gray-100 relative overflow-hidden">
                    ${imageTag}
                    <span class="status-badge absolute top-3 right-3 ${badge_class} px-2.5 py-1 rounded-lg text-xs font-bold border">
                        ${status_text}
                    </span>
                </div>
                
                <div class="p-5 flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex items-center space-x-1.5 text-xs font-medium text-gray-400 mb-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i>
                            <span>${court.campus_name} · ${court.location_type === 'indoor' ? 'ในร่ม' : 'กลางแจ้ง'}</span>
                        </div>
                        <h3 class="font-bold text-base text-gray-900 mb-1">${court.name}</h3>
                        <p class="text-xs text-gray-500 line-clamp-2 mb-4">${court.description}</p>
                    </div>
                    
                    <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span class="inline-flex items-center text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 rounded-md">
                            <i data-lucide="sparkles" class="w-3 h-3 mr-1"></i> สิทธิ์นักศึกษา ฟรี
                        </span>
                        <button onclick="window.location.href='booking-detail.html?court_id=${court.id}&date=${document.getElementById('filter-date').value}'" ${btn_disabled} 
                            class="action-btn ${btn_class} text-xs font-medium py-2 px-4 rounded-xl transition-all shadow-sm">
                            ${btn_text}
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // Render Lucide icons
    lucide.createIcons();
}

// Search Filter submission handler
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    const campusId = document.getElementById('filter-campus').value;
    const dateVal = document.getElementById('filter-date').value;
    
    let filtered = globalCourts;
    
    if (keyword) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(keyword) || c.sport_type.toLowerCase().includes(keyword));
    }
    
    if (campusId !== 'all') {
        filtered = filtered.filter(c => c.campus_id_val.toString() === campusId);
    }
    
    renderCourts(filtered);
    
    document.getElementById('grid-title').textContent = keyword 
        ? `ผลการค้นหาสำหรับ "${keyword}"` 
        : 'ตารางสนามกีฬา';
});

// Initialize Layout and fetch data
window.addEventListener('DOMContentLoaded', async () => {
    await fetchCourts();
    await loadLayout();
});
