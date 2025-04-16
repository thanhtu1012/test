// Biến toàn cục để lưu danh sách thành viên của user
let familiesList = [];

// Hàm đóng form (từ HTML onclick)
function closeVaccinationForm() {
    document.getElementById('formVaccination').style.display = 'none';
}


// Hàm tải danh sách vaccinations từ backend
function fetchVaccinations() {
    const tableBody = document.getElementById('vaccinationTableBody');
    tableBody.innerHTML = ''; // Xóa cũ

    fetch('http://localhost:8080/api/vaccinations')
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách vaccinations');
            return response.json();
        })
        .then(data => {
            data.forEach((vaccination) => {
                let memberName = '';
                if (typeof vaccination.family === 'number') {
                    const fam = familiesList.find(f => f.id === vaccination.family);
                    memberName = fam ? fam.memberName : vaccination.family;
                } else if (typeof vaccination.family === 'object' && vaccination.family.memberName) {
                    memberName = vaccination.family.memberName;
                }

                // Chuyển trạng thái sang tiếng Việt
                let statusInVietnamese = '';
                if (vaccination.status === 'vaccinated') {
                    statusInVietnamese = 'Đã tiêm';
                } else if (vaccination.status === 'not_vaccinated') {
                    statusInVietnamese = 'Chưa tiêm';
                } else if (vaccination.status === 'postponed') {
                    statusInVietnamese = 'Hoãn';
                } else {
                    statusInVietnamese = 'Không xác định';
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vaccination.id}</td>
                    <td>${vaccination.vaccineName}</td>
                    <td>${memberName}</td>
                    <td>${vaccination.vaccinationDate}</td>
                    <td>${statusInVietnamese}</td>
                    <td>
                        <button class="btn btn-edit" onclick="openEditVaccinationForm(${vaccination.id})">
                          <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-delete" onclick="deleteVaccination(${vaccination.id})">
                          <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách vaccinations:', error);
            alert('Không thể tải danh sách vaccinations');
        });
}



// Hàm hiển thị danh sách vaccinations lên bảng
// function renderVaccinations(vaccinations) {
//     const tableBody = document.getElementById('vaccinationTableBody');
//     tableBody.innerHTML = ''; // Xóa nội dung cũ
//
//     vaccinations.forEach(vaccination => {
//         // vaccination.family có thể là số (ID) do backend chỉ trả về ID
//         let memberName = '';
//         if (typeof vaccination.family === 'number') {
//             // Tra cứu tên thành viên từ familiesList
//             const familyObj = familiesList.find(fam => fam.id === vaccination.family);
//             memberName = familyObj ? familyObj.memberName : vaccination.family;
//         } else if (typeof vaccination.family === 'object' && vaccination.family.memberName) {
//             memberName = vaccination.family.memberName;
//         }
//
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${vaccination.id}</td>
//             <td>${vaccination.vaccineName}</td>
//             <td>${memberName}</td>
//             <td>${vaccination.vaccinationDate}</td>
//             <td>${vaccination.status}</td>
//             <td>
//                 <button class="btn btn-primary" onclick="openEditVaccinationForm(${vaccination.id})">
//                   <i class="fas fa-edit"></i> Sửa
//                 </button>
//                 <button class="btn btn-danger" onclick="deleteVaccination(${vaccination.id})">
//                   <i class="fas fa-trash"></i> Xóa
//                 </button>
//             </td>
//         `;
//         tableBody.appendChild(row);
//     });
// }

// Hàm load danh sách thành viên từ API và cập nhật dropdown
function populateFamilyMemberSelect() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    fetch(`http://localhost:8080/api/users/${user.id}/family-info`)
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách thành viên');
            return response.json();
        })
        .then(data => {
            const selectElement = document.getElementById('familyMemberSelect');
            if (!selectElement) return;

            selectElement.innerHTML = '<option value="">-- Chọn thành viên --</option>';
            data.forEach(member => {
                // Lưu vào biến toàn cục để sử dụng cho hiển thị Vaccination
                familiesList.push(member);
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.memberName;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách thành viên cho mũi tiêm:', error);
        });
}

// Hàm mở form thêm mới vaccination
function openCreateVaccinationForm() {
    document.getElementById('formTitle').textContent = 'Thêm Vaccination';
    document.getElementById('vaccinationId').value = '';
    document.getElementById('vaccineName').value = '';
    document.getElementById('vaccinationDate').value = '';
    document.getElementById('status').value = 'vaccinated';
    // Chọn thành viên mặc định (nếu có)
    const selectElement = document.getElementById('familyMemberSelect');
    if (selectElement && selectElement.options.length > 1) {
        selectElement.selectedIndex = 1;
    }
    document.getElementById('formVaccination').style.display = 'block';
}

// Hàm mở form sửa vaccination
function openEditVaccinationForm(id) {
    fetch(`http://localhost:8080/api/vaccinations/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải thông tin vaccination');
            return response.json();
        })
        .then(vaccination => {
            document.getElementById('formTitle').textContent = 'Sửa Vaccination';
            document.getElementById('vaccinationId').value = vaccination.id;
            document.getElementById('vaccineName').value = vaccination.vaccineName;
            document.getElementById('vaccinationDate').value = vaccination.vaccinationDate;
            document.getElementById('status').value = vaccination.status;

            const familyId = (typeof vaccination.family === 'number')
                ? vaccination.family
                : vaccination.family.id;

            document.getElementById('familyMemberSelect').value = familyId;
            document.getElementById('formVaccination').style.display = 'block';
        })
        .catch(error => {
            console.error('Lỗi khi tải vaccination:', error);
            alert('Có lỗi xảy ra khi tải thông tin vaccination');
        });
}


// Hàm xử lý submit form (thêm hoặc sửa)
function submitVaccinationForm(event) {
    event.preventDefault();

    const id = document.getElementById('vaccinationId').value;
    const vaccineName = document.getElementById('vaccineName').value;
    const vaccinationDate = document.getElementById('vaccinationDate').value;
    const status = document.getElementById('status').value;
    const familyId = document.getElementById('familyMemberSelect').value;

    if (!vaccineName || !vaccinationDate || !status || !familyId) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
    }

    const vaccinationData = {
        vaccineName,
        vaccinationDate,
        status,
        family: { id: parseInt(familyId) },
        vaccinationsStatus: 'active'
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `http://localhost:8080/api/vaccinations/${id}` : 'http://localhost:8080/api/vaccinations';

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccinationData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Không thể lưu vaccination');
            return response.json();
        })
        .then(data => {
            closeVaccinationForm();
            fetchVaccinations(); // Load lại danh sách
        })
        .catch(error => {
            console.error('Lỗi khi lưu vaccination:', error);
            alert('Có lỗi xảy ra khi lưu vaccination');
        });
}


// Hàm xóa vaccination
function deleteVaccination(id) {
    if (!confirm('Bạn có chắc muốn xóa mũi tiêm này không?')) return;

    fetch(`http://localhost:8080/api/vaccinations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            if (!response.ok) throw new Error('Không thể xóa vaccination');
            fetchVaccinations();
        })
        .catch(error => {
            console.error('Lỗi khi xóa vaccination:', error);
            alert('Có lỗi xảy ra khi xóa vaccination');
        });
}


// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    // Nếu đang ở trang Vaccination (đường dẫn có thể thay đổi tùy cấu hình)
    if (window.location.pathname === '/Vaccination') {
        fetchVaccinations();
        populateFamilyMemberSelect();
    }
    // Gán sự kiện cho nút "Thêm Vaccination" và form
    document.getElementById('createVaccinationBtn').addEventListener('click', openCreateVaccinationForm);
    document.getElementById('vaccinationForm').addEventListener('submit', submitVaccinationForm);
});

