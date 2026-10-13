checkAuth('admin');

const urlParams = new URLSearchParams(window.location.search);
const courtId = parseInt(urlParams.get('court_id') || 0);

if (courtId <= 0) {
    Swal.fire({
        title: 'ข้อผิดพลาด',
        text: 'ไม่พบรหัสอ้างอิงสนามกีฬา!',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'rounded-3xl' }
    }).then(() => {
        window.location.href = 'dashboard.html';
    });
}

document.getElementById('edit-court-id').value = courtId;

const sportSelect = document.getElementById('sport-type');
const otherSportContainer = document.getElementById('other-sport-container');
const customSportInput = document.getElementById('custom-sport-input');

// Event listener for sport type selection toggle
if (sportSelect) {
    sportSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            otherSportContainer?.classList.remove('hidden');
            customSportInput?.setAttribute('required', 'required');
            customSportInput?.focus();
        } else {
            otherSportContainer?.classList.add('hidden');
            customSportInput?.removeAttribute('required');
            if (customSportInput) customSportInput.value = '';
        }
        if (window.lucide) lucide.createIcons();
    });
}

// Fetch details
async function fetchCourtAndCampuses() {
    try {
        // 1. Fetch campuses and load select list
        const adminRes = await fetch('../api/admin/dashboard.php');
        const adminData = await adminRes.json();
        
        if (adminData.success) {
            const select = document.getElementById('campus-select');
            select.innerHTML = '';
            adminData.campuses.forEach(camp => {
                select.insertAdjacentHTML('beforeend', `<option value="${camp.id}">${camp.name}</option>`);
            });

            // Populate existing custom sports from other courts into dropdown
            if (adminData.courts && sportSelect) {
                const knownValues = ['futsal', 'badminton', 'football', 'tennis', 'basketball', 'volleyball', 'petanque', 'other'];
                const existingCustomSports = new Set();
                adminData.courts.forEach(c => {
                    if (c.sport_type && !knownValues.includes(c.sport_type)) {
                        existingCustomSports.add(c.sport_type);
                    }
                });

                const otherOption = sportSelect.querySelector('option[value="other"]');
                existingCustomSports.forEach(sport => {
                    if (!sportSelect.querySelector(`option[value="${sport}"]`)) {
                        const opt = document.createElement('option');
                        opt.value = sport;
                        opt.textContent = sport;
                        if (otherOption) {
                            sportSelect.insertBefore(opt, otherOption);
                        } else {
                            sportSelect.appendChild(opt);
                        }
                    }
                });
            }
        }
        
        // 2. Fetch court detail
        const detailRes = await fetch(`../api/courts/detail.php?court_id=${courtId}`);
        const detailData = await detailRes.json();
        
        if (detailData.success) {
            const court = detailData.court;
            document.getElementById('court-name').value = court.name;
            
            // Set sport type (check if known or custom)
            const knownValues = ['futsal', 'badminton', 'football', 'tennis', 'basketball', 'volleyball', 'petanque'];
            if (knownValues.includes(court.sport_type)) {
                sportSelect.value = court.sport_type;
                otherSportContainer?.classList.add('hidden');
                if (customSportInput) customSportInput.value = '';
            } else {
                let optionExists = false;
                for (let opt of sportSelect.options) {
                    if (opt.value === court.sport_type) {
                        optionExists = true;
                        break;
                    }
                }
                if (optionExists) {
                    sportSelect.value = court.sport_type;
                    otherSportContainer?.classList.add('hidden');
                } else {
                    sportSelect.value = 'other';
                    otherSportContainer?.classList.remove('hidden');
                    if (customSportInput) {
                        customSportInput.value = court.sport_type;
                        customSportInput.setAttribute('required', 'required');
                    }
                }
            }

            document.getElementById('campus-select').value = court.campus_id;
            
            if (court.location_type === 'indoor') {
                document.getElementById('loc-indoor').checked = true;
            } else {
                document.getElementById('loc-outdoor').checked = true;
            }
            
            document.getElementById('court-description').value = court.description;
            document.getElementById('opening-time').value = court.opening_time.slice(0, 5);
            document.getElementById('closing-time').value = court.closing_time.slice(0, 5);
            
            // Render image
            const imageBox = document.getElementById('current-image-box');
            if (court.image_url && court.image_url !== 'mock_image.jpg' && court.image_url !== 'default_court.jpg') {
                imageBox.innerHTML = `<img src="../uploads/courts/${court.image_url}" class="w-24 h-24 rounded-lg object-cover border border-gray-200 shadow-sm">`;
            } else {
                imageBox.innerHTML = `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">ไม่มีรูปภาพ</div>`;
            }
            
            // Pre-check facilities
            const facilities = detailData.facilities;
            facilities.forEach(fac => {
                const checkbox = document.querySelector(`input[name="facilities[]"][value="${fac}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
            if (window.lucide) lucide.createIcons();
        }
    } catch(e) {
        console.error(e);
    }
}

fetchCourtAndCampuses();

function handleFileSelect(input) {
    const preview = document.getElementById('file-preview-list');
    if (!preview) return;
    if (input.files && input.files.length > 0) {
        preview.classList.remove('hidden');
        preview.innerHTML = `✓ เลือกรูปภาพใหม่แล้ว: ${input.files[0].name}`;
    } else {
        preview.classList.add('hidden');
    }
}

// Form Submit
document.getElementById('edit-court-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const alertBox = document.getElementById('error-alert');
    const alertText = document.getElementById('error-alert-text');
    
    alertBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ กำลังบันทึกความเปลี่ยนแปลง...`;
    
    const formData = new FormData(this);

    // Validate and set sport_type
    const selectedSport = sportSelect ? sportSelect.value : '';
    if (selectedSport === 'other') {
        const customVal = customSportInput ? customSportInput.value.trim() : '';
        if (!customVal) {
            alertText.textContent = 'กรุณาระบุชื่อประเภทกีฬา/สนามในช่อง "อื่นๆ"';
            alertBox.classList.remove('hidden');
            Swal.fire({
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณาระบุชื่อประเภทกีฬา/สนามในช่อง "อื่นๆ"',
                icon: 'warning',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>บันทึกความเปลี่ยนแปลง</span>`;
            if (window.lucide) lucide.createIcons();
            if (customSportInput) customSportInput.focus();
            return;
        }
        formData.set('sport_type', customVal);
    } else {
        formData.set('sport_type', selectedSport);
    }

    // Append checked facilities
    const checkedFacs = this.querySelectorAll('input[name="facilities[]"]:checked');
    formData.delete('facilities[]');
    checkedFacs.forEach(f => {
        formData.append('facilities[]', f.value);
    });
    
    try {
        const response = await fetch('../api/admin/court-action.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            await Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: result.message || 'บันทึกความเปลี่ยนแปลงของสนามกีฬาเรียบร้อยแล้ว',
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
            window.location.href = 'dashboard.html';
        } else {
            alertText.textContent = result.message;
            alertBox.classList.remove('hidden');
            Swal.fire({
                title: 'ไม่สามารถบันทึกได้',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>บันทึกความเปลี่ยนแปลง</span>`;
            if (window.lucide) lucide.createIcons();
        }
    } catch (err) {
        alertText.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        alertBox.classList.remove('hidden');
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>บันทึกความเปลี่ยนแปลง</span>`;
        if (window.lucide) lucide.createIcons();
    }
});

// Bind file input change event safely
const courtFileInput = document.getElementById('court-image-input') || document.getElementById('file-upload');
if (courtFileInput) {
    courtFileInput.addEventListener('change', function() {
        handleFileSelect(this);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});
