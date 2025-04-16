// Lưu mapping: key = doctor id, value = tên bác sĩ (user.fullName)
let doctorMapping = {};

// Lưu danh sách hồ sơ đã gửi (transferred records)
let transferredRecords = [];

// --- PHẦN 1: TÌM KIẾM BÁC SĨ THEO CHUYÊN KHOA ---
// Hàm tìm kiếm bác sĩ theo chuyên khoa
function searchDoctors() {
    const specialty = document.getElementById('specialtyDropdown').value.toLowerCase();
    fetch('http://localhost:8080/api/doctors')
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải danh sách bác sĩ');
            return response.json();
        })
        .then(doctors => {
            let filteredDoctors = doctors;
            if (specialty !== 'all') {
                filteredDoctors = doctors.filter(doc => doc.specialty.toLowerCase() === specialty);
            }
            const tbody = document.querySelector('#doctorList tbody');
            tbody.innerHTML = '';
            if (filteredDoctors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6">Không có bác sĩ nào phù hợp</td></tr>`;
                return;
            }
            filteredDoctors.forEach((doctor, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${doctorMapping[doctor.id]}</td>
                    <td>${doctor.specialty}</td>
                    <td>${doctor.hospital}</td>
                    <td>${doctor.phone}</td>
                    <td><button class="btn btn-success" onclick="selectDoctor(${doctor.id})">Chọn</button></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải bác sĩ:', error);
            alert('Không thể tải danh sách bác sĩ.');
        });
}


// Khi người dùng chọn bác sĩ từ kết quả tìm kiếm
function selectDoctor(doctorId) {
    const doctorSelect = document.getElementById('doctorSelect');
    doctorSelect.value = doctorId;
    alert(`Đã chọn bác sĩ với ID: ${doctorId}`);
}

// --- PHẦN 2: GỬI HỒ SƠ BỆNH ÁN ---
// Tải danh sách thành viên của user đang đăng nhập
function loadMembers() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        console.error('Không tìm thấy thông tin user trong localStorage');
        return;
    }

    // Gọi API để lấy danh sách hồ sơ bệnh án
    fetch('http://localhost:8080/api/medical-records')
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách hồ sơ bệnh án');
            return response.json();
        })
        .then(records => {
            const memberSelect = document.getElementById('memberSelect');
            if (!memberSelect) return;

            // Xóa các option cũ và thêm option mặc định
            memberSelect.innerHTML = '<option value="">-- Chọn thành viên --</option>';

            // Duyệt qua danh sách hồ sơ bệnh án để lấy thông tin thành viên
            records.forEach(record => {
                const member = record.family; // Giả sử record có trường family chứa thông tin thành viên
                if (member && member.id) {
                    const option = document.createElement('option');
                    option.value = member.id; // ID thành viên
                    // Hiển thị: tên thành viên kèm chẩn đoán (nếu có)
                    const memberName = member.memberName || 'Không có tên';
                    const diagnosis = record.diagnosis ? ` - ${record.diagnosis}` : '';
                    option.textContent = `${memberName}${diagnosis}`;
                    option.dataset.recordId = record.id; // Lưu ID hồ sơ bệnh án
                    memberSelect.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách hồ sơ bệnh án:', error);
            alert('Không thể tải danh sách thành viên');
        });
}

// Hàm xử lý khi người dùng chọn thành viên và gửi form
function handleFormSubmit() {
    const memberSelect = document.getElementById('memberSelect');
    const selectedOption = memberSelect.selectedOptions[0];
    const recordId = selectedOption.dataset.recordId; // Lấy ID hồ sơ bệnh án

    if (!recordId) {
        alert('Vui lòng chọn một thành viên!');
        return;
    }

    // Xây dựng payload để gửi API
    const payload = {
        medicalRecordId: recordId,
        // Các trường dữ liệu khác nếu cần
    };

    fetch('http://localhost:8080/api/transferred-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Hồ sơ đã được gửi:', data);
        })
        .catch(error => {
            console.error('Lỗi khi gửi hồ sơ:', error);
        });
}

// Tải danh sách bác sĩ cho phần select trong form gửi hồ sơ
function loadDoctorsForSelect() {
    return fetch('http://localhost:8080/api/doctors')
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách bác sĩ');
            return response.json();
        })
        .then(doctors => {
            const doctorSelect = document.getElementById('doctorSelect');
            doctorSelect.innerHTML = '<option value="">-- Chọn bác sĩ --</option>';
            // Sử dụng Promise.all để đảm bảo mapping được cập nhật trước khi hiển thị danh sách option
            let promises = doctors.map(doctor => {
                // Gọi API lấy thông tin user dựa vào doctor.user (chú ý: doctor.user là ID của user)
                return fetch(`http://localhost:8080/api/users/${doctor.user}`)
                    .then(res => res.json())
                    .then(user => {
                        // Cập nhật mapping: key là doctor.id, value là tên bác sĩ từ user.fullName
                        doctorMapping[doctor.id] = user.fullName;
                        const option = document.createElement('option');
                        option.value = doctor.id;
                        // Hiển thị: Tên bác sĩ - Chuyên khoa (SĐT: …)
                        option.textContent = `${user.fullName} - ${doctor.specialty} (SĐT: ${doctor.phone})`;
                        return option;
                    })
                    .catch(error => {
                        console.error('Lỗi lấy thông tin user cho doctor id ' + doctor.id, error);
                    });
            });
            return Promise.all(promises);
        })
        .then(options => {
            const doctorSelect = document.getElementById('doctorSelect');
            options.forEach(option => {
                if (option) {
                    doctorSelect.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách bác sĩ:', error);
            alert('Không thể tải danh sách bác sĩ');
        });
}

// Gửi hồ sơ bệnh án đến bác sĩ gia đình
function sendMedicalRecord() {
    const memberSelect = document.getElementById('memberSelect');
    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
    const recordId = selectedOption.dataset.recordId; // Lấy recordId từ dataset
    const doctorId = document.getElementById('doctorSelect').value;

    if (!recordId) {
        alert('Không tìm thấy ID hồ sơ cho thành viên đã chọn.');
        return;
    }
    if (!doctorId) {
        alert('Vui lòng chọn bác sĩ.');
        return;
    }

    // Xây dựng payload theo model TransferredRecord (không có note)
    const payload = {
        medicalRecord: { id: parseInt(recordId) },
        doctor: { id: parseInt(doctorId) },
        status: 'pending',              // Mặc định là "Chờ xác nhận"
        transferredRecordsStatus: 'active'
    };

    console.log("Payload gửi đi:", payload);

    fetch('http://localhost:8080/api/transferred-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Lỗi khi gửi hồ sơ');
                });
            }
            return response.json();
        })
        .then(() => {
            alert('Gửi hồ sơ thành công!');
            loadTransferredRecords(); // Load lại danh sách hồ sơ
        })
        .catch(error => {
            console.error('Lỗi khi gửi hồ sơ:', error);
            alert('Không thể gửi hồ sơ: ' + error.message);
        });
}

// --- PHẦN 3: XEM TRẠNG THÁI HỒ SƠ ---
// Tải danh sách hồ sơ đã gửi từ backend
function loadTransferredRecords() {
    fetch('http://localhost:8080/api/transferred-records')
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách hồ sơ');
            return response.json();
        })
        .then(records => {
            transferredRecords = records; // Lưu vào biến toàn cục
            console.log("Transferred records:", records); // Debug: in dữ liệu nhận được
            displayRecords(records);
        })
        .catch(error => {
            console.error('Lỗi khi tải danh sách hồ sơ:', error);
            alert('Không thể tải danh sách hồ sơ');
        });
}

// Hiển thị danh sách hồ sơ
function displayRecords(records) {
    const tbody = document.querySelector('#recordStatusTable tbody');
    if (!tbody) {
        console.error("Không tìm thấy tbody của bảng recordStatusTable");
        return;
    }
    tbody.innerHTML = '';
    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Không có hồ sơ nào</td></tr>`;
        return;
    }

    records.forEach((record, index) => {
        // Debug log để kiểm tra cấu trúc record
        console.log("Xử lý record:", record);

        // Xác định doctorId:
        // Nếu record.doctor là object, ưu tiên sử dụng record.doctor.id. Nếu không có, thử lấy record.doctor.user.
        let doctorId = null;
        if (record.doctor) {
            if (typeof record.doctor === 'object' && record.doctor !== null) {
                doctorId = record.doctor.id || record.doctor.user;
            } else {
                doctorId = record.doctor;
            }
        }
        // Lấy tên bác sĩ từ mapping, nếu không có thì hiển thị fallback ("ID: …")
        const doctorName = doctorId ? (doctorMapping[doctorId] || ('ID: ' + doctorId)) : 'Không rõ';

        // Lấy tên thành viên từ record.medicalRecord.family
        const memberName = record.medicalRecord && record.medicalRecord.family && record.medicalRecord.family.memberName
            ? record.medicalRecord.family.memberName
            : 'Không rõ';

        const transferredAt = record.transferredAt ? new Date(record.transferredAt).toLocaleString() : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${memberName}</td>
            <td>${doctorName}</td>
            <td>${transferredAt}</td>
            <td>${formatStatus(record.status)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Chuyển đổi trạng thái sang text hiển thị
function formatStatus(status) {
    switch (status) {
        case 'pending': return 'Chờ xác nhận';
        case 'accepted': return 'Đã tiếp nhận';
        case 'completed': return 'Hoàn thành';
        default: return status;
    }
}

// Bộ lọc danh sách hồ sơ theo trạng thái
function filterRecords() {
    const filterValue = document.getElementById('statusFilter').value;
    let filteredRecords;
    if (filterValue === 'all') {
        filteredRecords = transferredRecords;
    } else {
        filteredRecords = transferredRecords.filter(record => record.status === filterValue);
    }
    displayRecords(filteredRecords);
}

document.addEventListener('DOMContentLoaded', function() {
    loadMembers();

    // Tải danh sách bác sĩ cho select và cập nhật mapping, sau đó:
    loadDoctorsForSelect().then(() => {
        // mapping đã có => giờ mới được gọi searchDoctors và loadTransferredRecords
        searchDoctors();
        loadTransferredRecords();
    });

    // Xử lý gửi hồ sơ bệnh án
    document.getElementById('sendRecordForm').addEventListener('submit', function(event) {
        event.preventDefault();
        sendMedicalRecord();
    });
});

