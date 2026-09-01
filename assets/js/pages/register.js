checkAuth();
loadLayout();

function toggleRoleUI(role) {
    const labelStudent = document.getElementById('label-student');
    const labelStaff = document.getElementById('label-staff');
    const usernameLabel = document.getElementById('username-label');
    const emailLabel = document.getElementById('email-label');
    const emailInput = document.getElementById('email');
    const staffNotice = document.getElementById('staff-notice');
    const usernameInput = document.getElementById('username');

    if (role === 'student') {
        labelStudent.className = "flex items-center justify-center p-2.5 border-2 border-psruGreen bg-green-50/50 rounded-xl cursor-pointer text-center font-bold text-psruGreen transition-all";
        labelStaff.className = "flex items-center justify-center p-2.5 border border-gray-200 rounded-xl cursor-pointer text-center font-semibold text-gray-500 hover:bg-gray-50 transition-all";
        usernameLabel.textContent = "รหัสนักศึกษา *";
        usernameInput.placeholder = "เช่น 6400000002 (10 หลัก)";
        usernameInput.setAttribute('maxlength', '10');
        if (emailLabel) emailLabel.textContent = "ที่อยู่อีเมลมหาวิทยาลัย (@psru.ac.th หรือ @live.psru.ac.th) *";
        if (emailInput) emailInput.placeholder = "เช่น 6400000002@live.psru.ac.th หรือ student@psru.ac.th";
        staffNotice.classList.add('hidden');
    } else {
        labelStaff.className = "flex items-center justify-center p-2.5 border-2 border-psruGreen bg-green-50/50 rounded-xl cursor-pointer text-center font-bold text-psruGreen transition-all";
        labelStudent.className = "flex items-center justify-center p-2.5 border border-gray-200 rounded-xl cursor-pointer text-center font-semibold text-gray-500 hover:bg-gray-50 transition-all";
        usernameLabel.textContent = "ชื่อบัญชีผู้ใช้ (Username) *";
        usernameInput.placeholder = "เช่น staff01";
        usernameInput.removeAttribute('maxlength');
        if (emailLabel) emailLabel.textContent = "ที่อยู่อีเมล *";
        if (emailInput) emailInput.placeholder = "เช่น staff@psru.ac.th หรือ example@email.com";
        staffNotice.classList.remove('hidden');
    }
}
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    
    const role = document.querySelector('input[name="role"]:checked').value;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();

    if (role === 'student' && username.length !== 10) {
        errorAlert.querySelector('#error-alert-text').textContent = "รหัสนักศึกษาต้องมีความยาว 10 หลักเท่านั้น";
        errorAlert.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อมูลการลงทะเบียน</span>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    if (role === 'student') {
        const emailLower = email.toLowerCase();
        if (!emailLower.endsWith('@psru.ac.th') && !emailLower.endsWith('@live.psru.ac.th')) {
            errorAlert.querySelector('#error-alert-text').textContent = "สำหรับการสมัครสมาชิกนักศึกษา กรุณาใช้อีเมลมหาวิทยาลัย (@psru.ac.th หรือ @live.psru.ac.th) เท่านั้น";
            errorAlert.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>ยืนยันข้อมูลการลงทะเบียน</span>`;
            if (window.lucide) lucide.createIcons();
            return;
        }
    }

    errorAlert.classList.add('hidden');
    successAlert.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ กำลังลงทะเบียน...`;
    
    const formData = new FormData();
    formData.append('role', role);
    formData.append('username', username);
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
