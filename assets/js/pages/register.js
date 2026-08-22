checkAuth();
loadLayout();

function toggleRoleUI(role) {
    const labelStudent = document.getElementById('label-student');
    const labelStaff = document.getElementById('label-staff');
    const usernameLabel = document.getElementById('username-label');
    const staffNotice = document.getElementById('staff-notice');

    if (role === 'student') {
        labelStudent.className = "flex items-center justify-center p-2.5 border-2 border-psruGreen bg-green-50/50 rounded-xl cursor-pointer text-center font-bold text-psruGreen transition-all";
        labelStaff.className = "flex items-center justify-center p-2.5 border border-gray-200 rounded-xl cursor-pointer text-center font-semibold text-gray-500 hover:bg-gray-50 transition-all";
        usernameLabel.textContent = "รหัสนักศึกษา *";
        staffNotice.classList.add('hidden');
    } else {
        labelStaff.className = "flex items-center justify-center p-2.5 border-2 border-psruGreen bg-green-50/50 rounded-xl cursor-pointer text-center font-bold text-psruGreen transition-all";
        labelStudent.className = "flex items-center justify-center p-2.5 border border-gray-200 rounded-xl cursor-pointer text-center font-semibold text-gray-500 hover:bg-gray-50 transition-all";
        usernameLabel.textContent = "ชื่อบัญชีผู้ใช้ (Username) *";
        staffNotice.classList.remove('hidden');
    }
}

document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    
    errorAlert.classList.add('hidden');
    successAlert.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ กำลังลงทะเบียน...`;
    
    const formData = new FormData();
    formData.append('role', document.querySelector('input[name="role"]:checked').value);
    formData.append('username', document.getElementById('username').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('first_name', document.getElementById('first_name').value);
    formData.append('last_name', document.getElementById('last_name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('confirm_password', document.getElementById('confirm_password').value);
    
    try {
        const response = await fetch('api/auth/register.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            successAlert.querySelector('#success-alert-text').textContent = result.message;
            successAlert.classList.remove('hidden');
            document.getElementById('register-form').reset();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        } else {
            errorAlert.querySelector('#error-alert-text').textContent = result.message;
            errorAlert.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อมูลการลงทะเบียน</span>`;
            lucide.createIcons();
        }
    } catch (err) {
        errorAlert.querySelector('#error-alert-text').textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
        errorAlert.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อมูลการลงทะเบียน</span>`;
        lucide.createIcons();
    }
});
