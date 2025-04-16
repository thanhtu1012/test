// Biến toàn cục lưu trữ mapping: key là doctor id, value là tên bác sĩ
let doctorMapping = {};

// Hàm load danh sách thành viên
function loadMembersForPDF() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        alert("Vui lòng đăng nhập!");
        return;
    }
    fetch(`http://localhost:8080/api/users/${user.id}/family-info`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('memberSelect');
            select.innerHTML = '<option value="">-- Chọn thành viên --</option>';
            data.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.memberName;
                select.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Lỗi tải thành viên:", err);
            alert("Không thể tải danh sách thành viên!");
        });
}

// Hàm chuyển đổi hình ảnh URL sang Base64 (nếu cần)
function getBase64Image(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Đảm bảo server hosting ảnh cho phép CORS
        img.setAttribute("crossOrigin", "anonymous");
        img.src = url;
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = function () {
            reject(new Error("Không thể tải ảnh"));
        };
    });
}

// Hàm chuẩn hóa chuỗi
function sanitizeString(value) {
    return value ? String(value) : "Không có dữ liệu";
}

// Hàm chuyển đổi giới tính sang tiếng Việt nếu cần
function formatGender(gender) {
    if (!gender) return "Không có dữ liệu";
    const lower = gender.toLowerCase();
    if (lower === "male") return "Nam";
    if (lower === "female") return "Nữ";
    return sanitizeString(gender);
}

// Hàm xuất PDF sử dụng html2pdf.js
async function exportMemberPDF() {
    const memberSelect = document.getElementById('memberSelect');
    const selectedMemberId = memberSelect.value;
    if (!selectedMemberId) {
        alert("Vui lòng chọn thành viên!");
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const familyResponse = await fetch(`http://localhost:8080/api/users/${user.id}/family-info`);
    const familyMembers = await familyResponse.json();
    const member = familyMembers.find(m => m.id == selectedMemberId);
    if (!member) {
        alert("Không tìm thấy thông tin thành viên!");
        return;
    }

    // Lấy dữ liệu hồ sơ khám bệnh, sổ tiêm chủng, hồ sơ chuyển
    const [medicalRecords, vaccinations, transferredRecords, imagesData] = await Promise.all([
        fetch('http://localhost:8080/api/medical-records').then(res => res.json()).catch(() => []),
        fetch('http://localhost:8080/api/vaccinations').then(res => res.json()).catch(() => []),
        fetch('http://localhost:8080/api/transferred-records').then(res => res.json()).catch(() => []),
        fetch('http://localhost:8080/api/medical-images').then(res => res.json()).catch(() => [])
    ]);

    // Lọc hồ sơ khám bệnh của thành viên
    const memberMedicalRecords = medicalRecords.filter(record => record.family && record.family.id == member.id);
    // Lọc sổ tiêm chủng của thành viên
    const memberVaccinations = vaccinations.filter(vac => {
        if (typeof vac.family === 'number') return vac.family == member.id;
        if (typeof vac.family === 'object' && vac.family?.id) return vac.family.id == member.id;
        return false;
    });
    // Lọc hồ sơ chuyển của thành viên
    const memberTransferredRecords = transferredRecords.filter(tr => {
        return tr.medicalRecord && tr.medicalRecord.family && tr.medicalRecord.family.id == member.id;
    });

    // Với mỗi hồ sơ chuyển, lấy thông tin bác sĩ đầy đủ (Tên - SĐT - Bệnh viện)
    const transferredRecordsWithDoctorInfo = await Promise.all(
        memberTransferredRecords.map(async tr => {
            let doctorDisplay = "Không có dữ liệu";
            if (tr.doctor) {
                // Nếu tr.doctor là object thì lấy thuộc tính id, nếu không thì dùng chính nó
                const doctorId = typeof tr.doctor === 'object' ? tr.doctor.id : tr.doctor;
                // Nếu đã có thông tin đầy đủ về bác sĩ thì dùng luôn
                if (tr.doctor && typeof tr.doctor === 'object' && tr.doctor.fullName) {
                    doctorDisplay = `${sanitizeString(tr.doctor.fullName)} - ${sanitizeString(tr.doctor.phone)} - ${sanitizeString(tr.doctor.hospital)}`;
                } else {
                    try {
                        const doctorRes = await fetch(`http://localhost:8080/api/doctors/${doctorId}`);
                        if (!doctorRes.ok) throw new Error('Không lấy được thông tin bác sĩ');
                        const doctorData = await doctorRes.json();
                        // Lấy thông tin người dùng của bác sĩ từ doctorData.user
                        const userRes = await fetch(`http://localhost:8080/api/users/${doctorData.user}`);
                        if (!userRes.ok) throw new Error('Không lấy được thông tin user của bác sĩ');
                        const userData = await userRes.json();
                        doctorDisplay = `${sanitizeString(userData.fullName)} - ${sanitizeString(doctorData.phone)} - ${sanitizeString(doctorData.hospital)}`;
                    } catch (error) {
                        console.error(error);
                        doctorDisplay = `ID: ${doctorId}`;
                    }
                }
            }
            return { ...tr, doctorDisplay };
        })
    );

    // Lọc ảnh bệnh án của thành viên từ danh sách ảnh, dựa vào thuộc tính medicalRecord.family.id
    const memberImages = imagesData.filter(img =>
        img.medicalRecord &&
        img.medicalRecord.family &&
        img.medicalRecord.family.id == member.id &&
        img.medicalImagesStatus === 'active'
    );
    // Chuyển các ảnh sang Base64 để đảm bảo không gặp vấn đề CORS khi xuất PDF
    const memberImagesWithBase64 = await Promise.all(
        memberImages.map(async (img) => {
            try {
                const base64 = await getBase64Image(img.imageUrl);
                return { ...img, base64 };
            } catch (error) {
                console.error(error);
                // Nếu chuyển Base64 thất bại, fallback dùng URL gốc (có thể gây lỗi nếu server chặn CORS)
                return { ...img, base64: img.imageUrl };
            }
        })
    );

    // Tạo nội dung HTML cho PDF với bố cục cập nhật
    const contentHtml = `
    <div id="pdfContent" style="padding:20px; font-family: 'Times New Roman', Times, serif;">
      <!-- Header: Logo và tiêu đề -->
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <img src="/images/logo2.png" style="width:80px; height:80px; margin-right: 20px;" alt="Logo">
        <h1>HỒ SƠ Y TẾ</h1>
      </div>
      <hr>
      <!-- 1. Thông Tin Cá Nhân -->
      <h2>1. Thông Tin Cá Nhân</h2>
      <p><strong>Họ và tên:</strong> ${sanitizeString(member.memberName)}</p>
      <p><strong>Ngày sinh:</strong> ${sanitizeString(member.birthDate)}</p>
      <p><strong>Giới tính:</strong> ${formatGender(member.gender)}</p>
      <p><strong>Quan hệ:</strong> ${sanitizeString(member.relationship)}</p>
      <!-- 2. Hồ Sơ Khám Bệnh -->
      <h2>2. Hồ Sơ Khám Bệnh</h2>
      ${memberMedicalRecords.length === 0 ? '<p>Chưa có dữ liệu.</p>' : `
        <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse;">
          <tr style="background-color: #0066CC; color: #FFF;">
            <th>Ngày</th>
            <th>Chẩn đoán</th>
            <th>Điều trị</th>
          </tr>
          ${memberMedicalRecords.map(record => `
            <tr>
              <td>${sanitizeString(record.visitDate)}</td>
              <td>${sanitizeString(record.diagnosis)}</td>
              <td>${sanitizeString(record.treatment)}</td>
            </tr>
          `).join('')}
        </table>
      `}
            <!-- 3. Ảnh Bệnh Án -->
      <h2>3. Ảnh Bệnh Án</h2>
      ${memberImagesWithBase64.length === 0 ? '<p>Chưa có dữ liệu.</p>' : `
          ${memberImagesWithBase64.map(img => `
            <div style="display: flex; margin-bottom: 20px; align-items: center; border: 1px solid #ccc; padding: 10px; border-radius: 10px;">
              <div style="flex: 1; padding-right: 10px;">
                <p><strong>Mô tả:</strong> ${sanitizeString(img.description)}</p>
              </div>
              <div style="flex: 1; text-align: right;">
                <img src="${img.base64}" alt="Ảnh bệnh án" style="max-width: 100%; max-height: 200px; border-radius: 5px;">
              </div>
            </div>
          `).join('')}
      `}

      <!-- 4. Sổ Tiêm Chủng -->
      <h2>4. Sổ Tiêm Chủng</h2>
      ${memberVaccinations.length === 0 ? '<p>Chưa có dữ liệu.</p>' : `
            <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse;">
              <tr style="background-color: #0066CC; color: #FFF;">
                <th>Vắc xin</th>
                <th>Ngày tiêm</th>
                <th>Trạng thái</th>
              </tr>
              ${memberVaccinations.map(vac => {
            let statusInVietnamese = '';
            if (vac.status === 'vaccinated') {
                statusInVietnamese = 'Đã tiêm';
            } else if (vac.status === 'not_vaccinated') {
                statusInVietnamese = 'Chưa tiêm';
            } else if (vac.status === 'postponed') {
                statusInVietnamese = 'Hoãn';
            } else {
                statusInVietnamese = 'Không xác định';
            }
            return `<tr>
                            <td>${sanitizeString(vac.vaccineName)}</td>
                            <td>${sanitizeString(vac.vaccinationDate)}</td>
                            <td>${statusInVietnamese}</td>
                          </tr>`;
            }).join('')}
            </table>
      `}

        <!-- 5. Trạng Thái Chuyển Hồ Sơ -->
        <div style="page-break-inside: avoid;">
          <h2>5. Trạng Thái Chuyển Hồ Sơ</h2>
          ${transferredRecordsWithDoctorInfo.length === 0 ? '<p>Chưa có dữ liệu.</p>' : `
            <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse;">
              <tr style="background-color: #0066CC; color: #FFF;">
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Bác sĩ</th>
              </tr>
              ${transferredRecordsWithDoctorInfo.map(tr => {
                let statusText = '';
                const statusLower = tr.status ? tr.status.toLowerCase() : '';
                switch (statusLower) {
                    case 'pending':
                        statusText = 'Chờ xác nhận';
                        break;
                    case 'accepted':
                        statusText = 'Đã tiếp nhận';
                        break;
                    case 'completed':
                        statusText = 'Hoàn thành';
                        break;
                    default:
                        statusText = sanitizeString(tr.status);
                }
                return `<tr>
                  <td>${sanitizeString(new Date(tr.transferredAt).toLocaleString())}</td>
                  <td>${statusText}</td>
                  <td>${tr.doctorDisplay}</td>
                </tr>`;
            }).join('')}
            </table>
          `}
        </div>
    </div>
    `;

    // Tạo phần tử tạm để chèn HTML và chuyển đổi sang PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    document.body.appendChild(tempDiv);

    // Cấu hình tùy chọn cho html2pdf
    const opt = {
        margin: 10,
        filename: `${sanitizeString(member.memberName)}_HoSoYTe.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Chuyển đổi HTML thành PDF và tải file, sau đó xóa phần tử tạm
    html2pdf().set(opt).from(tempDiv).save().then(() => {
        document.body.removeChild(tempDiv);
    });
}

// Load danh sách thành viên và các chức năng khác khi trang được load
document.addEventListener("DOMContentLoaded", function () {
    loadMembersForPDF();
    // Giả định hàm loadDoctorsToSelect được định nghĩa riêng ở nơi khác (để đảm bảo doctorMapping đã sẵn sàng)
    if (typeof loadDoctorsToSelect === 'function') {
        loadDoctorsToSelect();
    }
});
