// Biến toàn cục lưu trữ mapping: key là doctor id, value là tên bác sĩ
let doctorMapping = {};

function openForm(formId) {
    document.getElementById(`form${formId}`).style.display = 'block';
}

function closeForm(formId) {
    document.getElementById(`form${formId}`).style.display = 'none';
    document.getElementById('medicalRecordForm').reset();
    document.getElementById('formTitle').textContent = 'Thêm Hồ Sơ Khám Bệnh';
    document.getElementById('recordId').value = '';
}

function loadDoctorsToSelect() {
    const select = document.getElementById('doctorId');
    if (!select) return Promise.resolve();

    return fetch('http://localhost:8080/api/doctors')
        .then(res => res.json())
        .then(doctors => {
            select.innerHTML = '<option value="">-- Chọn bác sĩ --</option>';
            let promises = doctors.map(doc => {
                return fetch(`http://localhost:8080/api/users/${doc.user}`)
                    .then(response => response.json())
                    .then(user => {
                        doctorMapping[doc.id] = user.fullName;
                        const option = document.createElement('option');
                        option.value = doc.id;
                        option.textContent = `${user.fullName} (${doc.hospital})`;
                        return option;
                    })
                    .catch(error => console.error('Lỗi lấy user bác sĩ:', error));
            });
            return Promise.all(promises);
        })
        .then(options => {
            options.forEach(option => {
                if (option) select.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Lỗi khi tải danh sách bác sĩ:', err);
            alert('Không thể tải danh sách bác sĩ');
        });
}

function loadMedicalRecords() {
    fetch('http://localhost:8080/api/medical-records')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#medicalRecordList tbody');
            tbody.innerHTML = '';
            data.forEach((record, index) => {
                const doctorId = (typeof record.doctor === 'object' && record.doctor !== null)
                    ? record.doctor.id : record.doctor;
                const doctorName = doctorMapping[doctorId] || ('ID: ' + doctorId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${record.visitDate}</td>
                    <td>${record.diagnosis}</td>
                    <td>${doctorName}</td>
                    <td>${record.treatment}</td>
                    <td>
                        <button class="btn btn-primary" onclick="openAddImageModal(${record.id})">
                            <i class="fas fa-image"></i> Thêm ảnh
                        </button>
                        <button class="btn btn-info" onclick="viewImages(${record.id})">
                            <i class="fas fa-eye"></i> Xem ảnh
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-edit" onclick="editMedicalRecord(${record.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-delete" onclick="deleteMedicalRecord(${record.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Lỗi khi tải hồ sơ:', error));
}

function loadFamilyMembersToSelect() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    fetch(`http://localhost:8080/api/users/${user.id}/family-info`)
        .then(response => {
            if (!response.ok) throw new Error('Không lấy được danh sách thành viên');
            return response.json();
        })
        .then(data => {
            const select = document.getElementById('familyId');
            select.innerHTML = '<option value="">-- Chọn thành viên --</option>';
            data.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                const genderText = member.gender === 'MALE' ? 'Nam' : member.gender === 'FEMALE' ? 'Nữ' : 'Không xác định';
                option.textContent = `${member.memberName} (${member.relationship} - ${genderText})`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể tải danh sách thành viên');
        });
}

function editMedicalRecord(id) {
    fetch(`http://localhost:8080/api/medical-records/${id}`)
        .then(res => res.json())
        .then(record => {
            openForm('ThemHoSo');
            document.getElementById('formTitle').textContent = 'Chỉnh Sửa Hồ Sơ';
            document.getElementById('recordId').value = record.id;
            document.getElementById('visitDate').value = record.visitDate;
            document.getElementById('diagnosis').value = record.diagnosis;
            document.getElementById('treatment').value = record.treatment;
            document.getElementById('doctorId').value = record.doctor.id;
            document.getElementById('familyId').value = record.family.id;
        })
        .catch(error => alert('Không lấy được hồ sơ'));
}

function deleteMedicalRecord(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này không?')) return;
    fetch(`http://localhost:8080/api/medical-records/${id}`, {
        method: 'DELETE'
    })
        .then(() => {
            alert('Xóa thành công');
            loadMedicalRecords();
        })
        .catch(err => alert('Lỗi khi xóa'));
}

function handleFormSubmit(event) {
    event.preventDefault();
    const recordId = document.getElementById('recordId').value;
    const data = {
        visitDate: document.getElementById('visitDate').value,
        diagnosis: document.getElementById('diagnosis').value,
        treatment: document.getElementById('treatment').value,
        doctor: { id: document.getElementById('doctorId').value },
        family: { id: document.getElementById('familyId').value },
        medicalRecordsStatus: 'active'
    };

    let url = 'http://localhost:8080/api/medical-records';
    let method = 'POST';
    if (recordId) {
        url += `/${recordId}`;
        method = 'PUT';
        data.id = recordId;
    }

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text); });
            return res.json();
        })
        .then(() => {
            alert('Lưu hồ sơ thành công');
            closeForm('ThemHoSo');
            loadMedicalRecords();
        })
        .catch(error => {
            alert('Lỗi khi lưu hồ sơ: ' + error.message);
        });
}

function openAddImageModal(recordId) {
    document.getElementById('modalAddImage').style.display = 'block';
    document.getElementById('imageRecordId').value = recordId;
}

function closeAddImageModal() {
    document.getElementById('modalAddImage').style.display = 'none';
    document.getElementById('addImageForm').reset();
    document.getElementById('loadingIndicator').style.display = 'none';
}

function viewImages(recordId) {
    fetch('http://localhost:8080/api/medical-images')
        .then(res => res.json())
        .then(images => {
            const container = document.getElementById('imageListContainer');
            container.innerHTML = '';
            const filtered = images.filter(img =>
                img.medicalRecord.id === recordId && img.medicalImagesStatus === 'active'
            );
            if (filtered.length === 0) {
                container.innerHTML = '<p>Không có ảnh nào.</p>';
            } else {
                filtered.forEach(img => {
                    const item = document.createElement('div');
                    item.classList.add('image-item');

                    const thumbnail = document.createElement('img');
                    thumbnail.src = img.imageUrl;
                    thumbnail.alt = 'medical';
                    thumbnail.style.maxWidth = '200px';
                    thumbnail.style.cursor = 'pointer';
                    thumbnail.addEventListener('click', () => {
                        openFullScreenImage(img.imageUrl, img.description);
                    });

                    const desc = document.createElement('p');
                    desc.innerHTML = `<strong>Mô tả:</strong> ${img.description}`;



                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Xóa ảnh';
                    deleteBtn.className = 'btn btn-delete';
                    deleteBtn.addEventListener('click', () => {
                        if (confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) {
                            deleteImage(img.id, recordId);
                        }
                    });

                    item.appendChild(thumbnail);
                    item.appendChild(desc);
                    item.appendChild(deleteBtn);

                    container.appendChild(item);
                });
            }
            document.getElementById('modalViewImages').style.display = 'block';
        })
        .catch(err => {
            alert('Lỗi khi tải ảnh');
            console.error(err);
        });
}

function closeViewImageModal() {
    document.getElementById('modalViewImages').style.display = 'none';
    document.getElementById('imageListContainer').innerHTML = '';
}

function openFullScreenImage(imageUrl, description) {
    document.getElementById('fullScreenImg').src = imageUrl;
    document.getElementById('fullScreenDesc').textContent = description;
    document.getElementById('modalFullScreenImage').style.display = 'block';
}

function closeFullScreenImage() {
    document.getElementById('modalFullScreenImage').style.display = 'none';
}

function deleteImage(imageId, recordId) {
    fetch(`http://localhost:8080/api/medical-images/${imageId}`, { method: 'DELETE' })
        .then(() => {
            alert('Xóa ảnh thành công!');
            viewImages(recordId);
        })
        .catch(err => {
            alert('Lỗi khi xóa ảnh: ' + err.message);
        });
}

function editImage(imageId, currentDescription) {
    const newDesc = prompt('Nhập mô tả mới:', currentDescription);
    if (newDesc === null) return;

    const data = { description: newDesc };

    fetch(`http://localhost:8080/api/medical-images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) throw new Error('Lỗi khi sửa ảnh');
            return res.json();
        })
        .then(() => {
            alert('Sửa ảnh thành công!');
            const recordId = document.getElementById('imageRecordId').value;
            viewImages(recordId);
        })
        .catch(err => {
            alert('Lỗi khi sửa ảnh: ' + err.message);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const recordForm = document.getElementById('medicalRecordForm');
    if (recordForm) {
        recordForm.addEventListener('submit', handleFormSubmit);
    }

    const addImageForm = document.getElementById('addImageForm');
    if (addImageForm) {
        addImageForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.style.display = 'flex';

            const recordId = document.getElementById('imageRecordId').value;
            const description = document.getElementById('imageDescription').value;
            const fileInput = document.getElementById('imageFile');
            const file = fileInput.files[0];

            if (!file) {
                alert('Vui lòng chọn ảnh');
                loadingIndicator.style.display = 'none';
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'breezeboy');

            try {
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dblec2vjz/upload', {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();
                const imageUrl = cloudData.secure_url;

                const data = {
                    medicalRecord: { id: recordId },
                    imageUrl,
                    description,
                    medicalImagesStatus: 'active'
                };

                const backendRes = await fetch('http://localhost:8080/api/medical-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!backendRes.ok) throw new Error('Lỗi backend');

                alert('Thêm ảnh thành công!');
                closeAddImageModal();
            } catch (err) {
                alert('Lỗi khi thêm ảnh: ' + err.message);
            } finally {
                loadingIndicator.style.display = 'none';
            }
        });
    }

    loadDoctorsToSelect().then(loadMedicalRecords);
    loadFamilyMembersToSelect();
});
