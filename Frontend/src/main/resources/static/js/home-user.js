function openForm(formId) {
    document.getElementById('formThemThanhVien').style.display = 'block';
}

function closeForm(formId) {
    document.getElementById('formThemThanhVien').style.display = 'none';
}

// Hàm tải danh sách thành viên gia đình

function loadFamilyMembers() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    fetch(`http://localhost:8080/api/users/${user.id}/family-info`)
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách thành viên');
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector('#memberList tbody');
            tbody.innerHTML = '';

            data.forEach((member, index) => {
                const row = document.createElement('tr');

                // Chuyển đổi giới tính sang tiếng Việt
                let genderText = '';
                if (member.gender === 'male') { // Đồng bộ với giá trị từ <select>
                    genderText = 'Nam';
                } else if (member.gender === 'female') {
                    genderText = 'Nữ';
                } else if (member.gender === 'other') {
                    genderText = 'Khác';
                } else {
                    genderText = 'Không xác định'; // Trường hợp giá trị không khớp
                }

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${member.memberName}</td>
                    <td>${member.birthDate}</td>
                    <td>${genderText}</td>
                    <td>${member.relationship}</td>
                    <td>
                        <button class="btn btn-edit" onclick="openEditForm(${member.id})"><i class="fas fa-edit"></i> Sửa</button>
                        <button class="btn btn-delete" onclick="deleteFamilyMember(${member.id})"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Lỗi:', error));
}

// Hàm xử lý form thêm thành viên gia đình
function handleFamilyFormSubmit(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        alert('Vui lòng đăng nhập lại!');
        return;
    }

    const memberId = document.getElementById('memberId').value;
    const family = {
        id: memberId || null,
        memberName: document.getElementById('memberName').value,
        birthDate: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        relationship: document.getElementById('relationship').value,
        user: { id: user.id },
        familiesStatus: 'active'
    };

    let url = 'http://localhost:8080/api/families';
    let method = 'POST';
    if (memberId) {
        url = `http://localhost:8080/api/families/${memberId}`;
        method = 'PUT';
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(family)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Lỗi khi lưu thành viên');
                });
            }
            return response.json();
        })
        .then(() => {
            closeForm('ThemThanhVien');
            loadFamilyMembers();
            alert(memberId ? 'Cập nhật thành viên thành công!' : 'Thêm thành viên thành công!');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Lỗi khi lưu thành viên: ' + error.message);
        });
}
// Hàm mở/đóng form
function openForm(formId) {
    const form = document.getElementById(`form${formId}`);
    if (form) form.style.display = 'flex';
}
function closeForm(formId) {
    const form = document.getElementById(`form${formId}`);
    if (form) form.style.display = 'none';
    document.getElementById('familyForm').reset();
    document.getElementById('memberId').value = '';
    document.getElementById('formTitle').textContent = 'Thêm Thành Viên';
}
function openEditForm(memberId) {
    fetch(`http://localhost:8080/api/families/${memberId}`)
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được dữ liệu thành viên');
            return response.json();
        })
        .then(member => {
            openForm('ThemThanhVien');
            document.getElementById('memberId').value = member.id;
            document.getElementById('memberName').value = member.memberName;
            document.getElementById('birthDate').value = member.birthDate;
            document.getElementById('gender').value = member.gender;
            document.getElementById('relationship').value = member.relationship;
            document.getElementById('formTitle').textContent = 'Chỉnh Sửa Thành Viên';
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể lấy thông tin thành viên');
        });
}
function deleteFamilyMember(memberId) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này không?')) return;

    fetch(`http://localhost:8080/api/families/${memberId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error('Lỗi khi xóa thành viên');
            loadFamilyMembers();
            alert('Đã xóa thành viên');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể xóa thành viên');
        });
}
// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', () => {

    const emailField = document.querySelector('input[type="email"]');
    const passwordField = document.querySelector('input[type="password"]');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const familyForm = document.getElementById('familyForm');
    if (window.location.pathname === '/Home-User') {
        loadFamilyMembers();
    }
    // Load dữ liệu từ localStorage cho đăng nhập
    if (localStorage.getItem('rememberMe') === 'true') {
        if (emailField) emailField.value = localStorage.getItem('email') || '';
        if (passwordField) passwordField.value = localStorage.getItem('password') || '';
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }

    // Tải danh sách thành viên gia đình khi vào trang Home-User
    if (window.location.pathname === '/Home-User') {
        loadFamilyMembers();
    }

    // Xử lý form thêm thành viên gia đình
    if (familyForm) {
        familyForm.addEventListener('submit', handleFamilyFormSubmit);
    }
});

