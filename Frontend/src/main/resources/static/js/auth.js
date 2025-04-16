// auth.js
// ==========
// File này kết hợp các chức năng đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, thay đổi mật khẩu và xác thực OTP.
// Các hàm global sẽ được định nghĩa bên ngoài để có thể gọi từ các file HTML khi cần.

// ==== Hàm xử lý đăng nhập bằng Google ====
function handleGoogleLogin(response) {
    if (response.credential) {
        console.log('Google Token:', response.credential);
        fetch('http://localhost:8080/api/users/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        })
            .then(res => {
                if (!res.ok) throw new Error('Đăng nhập Google thất bại');
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu từ backend:', data);
                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('userId', data.id);
                // Nếu tài khoản đã đăng ký
                if (data.isRegistered) {
                    // Kiểm tra vai trò và điều hướng
                    switch (data.role) {
                        case 'family':
                            window.location.href = '/Home-User';
                            break;
                        case 'doctor':
                            window.location.href = '/Home-Doctor';
                            break;
                        case 'admin':
                            window.location.href = '/Home-Admin';
                            break;
                        default:
                            alert('Vai trò không hợp lệ!');
                            window.location.href = '/Login';
                            break;
                    }
                } else {
                    // Nếu chưa đăng ký, chuyển đến trang đăng ký
                    localStorage.setItem('user', JSON.stringify({
                        fullName: data.fullName,
                        email: data.email
                    }));
                    window.location.href = '/Register';
                }
            })
            .catch(error => {
                console.error('Đăng nhập Google thất bại:', error);
                alert('Đăng nhập bằng Google thất bại: ' + error.message);
            });
    } else {
        alert('Không nhận được thông tin xác thực từ Google!');
    }
}

// ==== Hàm đăng xuất ====
function logout() {
    // Xóa thông tin phiên đăng nhập (ví dụ thông tin người dùng)
    localStorage.removeItem('user');

    // Nếu sử dụng Google Sign-In, thu hồi quyền truy cập mà không ảnh hưởng đến thông tin ghi nhớ đăng nhập
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.revoke(localStorage.getItem('email'), () => {
            console.log('Đã thu hồi quyền truy cập Google Sign-In');
        });
    }
    // Chuyển hướng về trang đăng nhập
    window.location.href = '/Login';
}

// ==== Xử lý các sự kiện trên DOM sau khi tải xong ==========
document.addEventListener('DOMContentLoaded', () => {
    // ---------- Xử lý đăng nhập và đăng ký ----------
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    // Các field đăng nhập
    const emailField = document.querySelector('input[name="email"]');
    const passwordField = document.querySelector('input[name="password"]');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Điền thông tin từ localStorage nếu có (cho chức năng "Nhớ tôi" khi đăng nhập)
    if (localStorage.getItem('rememberMe') === 'true' && emailField && passwordField && rememberMeCheckbox) {
        emailField.value = localStorage.getItem('email') || '';
        passwordField.value = localStorage.getItem('password') || '';
        rememberMeCheckbox.checked = true;
    }

    // --- Xử lý form đăng nhập ---
    if (loginForm) {
        loginForm.addEventListener('submit', async event => {
            event.preventDefault();
            const email = emailField.value;
            const password = passwordField.value;
            const rememberMe = rememberMeCheckbox.checked;

            try {
                const response = await fetch('http://localhost:8080/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Đăng nhập thất bại');
                }
                const data = await response.json();

                // Lưu thông tin nếu chọn "Nhớ tôi"
                if (rememberMe) {
                    localStorage.setItem('email', email);
                    localStorage.setItem('password', password);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('email');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }

                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.setItem('userId', data.id);

                // Điều hướng theo vai trò của người dùng
                switch (data.role) {
                    case 'family':
                        window.location.href = '/Home-User';
                        break;
                    case 'doctor':
                        window.location.href = '/Home-Doctor';
                        break;
                    case 'admin':
                        window.location.href = '/Home-Admin';
                        break;
                    default:
                        alert('Không xác định được vai trò người dùng!');
                        break;
                }
            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                alert('Đăng nhập thất bại: ' + error.message);
            }
        });
    }

// --- Xử lý form đăng ký ---
    if (registerForm) {
        // Điền thông tin từ localStorage nếu có (hỗ trợ đăng ký qua Google)
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.fullName && userData.email) {
                document.getElementById('fullName').value = userData.fullName;
                document.getElementById('email').value = userData.email;
            }
        } catch (e) {
            console.error('Lỗi khi parse dữ liệu từ localStorage:', e);
        }
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.style.display = 'block'; // Hiện loading

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('role').value;

            if (!fullName || !email || !password || !role) {
                alert('Vui lòng điền đầy đủ thông tin!');
                loadingIndicator.style.display = 'none';
                return;
            }
            if (password !== confirmPassword) {
                alert('Mật khẩu và xác nhận mật khẩu không khớp!');
                loadingIndicator.style.display = 'none';
                return;
            }

            // Kiểm tra email đã tồn tại trong database chưa dùng findByEmail
            try {
                const checkResponse = await fetch(`http://localhost:8080/api/users/findByEmail?email=<encoded email>`, {
                    method: 'GET'
                });
                // Giả sử backend trả về JSON dạng { found: true, user: { ... } } nếu có email
                const checkData = await checkResponse.json();
                if (checkData.found) {
                    alert('Email đã tồn tại!');
                    loadingIndicator.style.display = 'none';
                    return;
                }
            } catch (error) {
                console.error('Lỗi kiểm tra email:', error);
                alert('Không thể kiểm tra email. Vui lòng thử lại.');
                loadingIndicator.style.display = 'none';
                return;
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000);
            localStorage.setItem('pendingUser', JSON.stringify({
                fullName, email, password, role, otp
            }));
            emailjs.send('service_qk4oign', 'template_lehzjxo', {
                name: fullName,
                passcode: otp,
                email: email
            })
                .then(() => {
                    alert('Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra email.');
                    window.location.href = '/Enter-OTP';
                })
                .catch((error) => {
                    console.error('Lỗi khi gửi email:', error);
                    alert('Không thể gửi OTP. Vui lòng thử lại. Chi tiết: ' + JSON.stringify(error));
                })
                .finally(() => {
                    loadingIndicator.style.display = 'none';
                });
        });
    }



    // ---------- Xử lý quên mật khẩu ----------
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = forgotForm.querySelector('input[name="email"]').value.trim();

            if (!email) {
                alert('Vui lòng nhập email!');
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/api/users/forgot-password?email=${encodeURIComponent(email)}`, {
                    method: 'POST'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Gửi OTP thất bại');
                }

                // API trả về token (dùng cho kiểm thử; thông thường người dùng nhận OTP qua email)
                const token = await response.text();
                alert('Email đã được gửi. Vui lòng kiểm tra email để lấy mã OTP.');

                // Lưu thông tin email và token nếu cần (cho mục đích hiển thị)
                localStorage.setItem('resetInfo', JSON.stringify({ email, token }));

                // Chuyển hướng sang trang Reset Password
                window.location.href = '/ResetPassword';
            } catch (error) {
                alert('Lỗi: ' + error.message);
                console.error('Error sending OTP:', error);
            }
        });
    }

    // ---------- Xử lý đặt lại mật khẩu ----------
    const resetForm = document.getElementById('resetPasswordForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = resetForm.querySelector('input[name="token"]').value.trim();
            const newPassword = resetForm.querySelector('input[name="newPassword"]').value;

            if (!token || !newPassword) {
                alert('Vui lòng nhập đầy đủ thông tin');
                return;
            }

            try {
                const response = await fetch(`http://localhost:8080/api/users/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`, {
                    method: 'POST'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Đặt lại mật khẩu thất bại');
                }

                const message = await response.text();
                alert(message);

                // Sau khi reset, xóa thông tin reset nếu có
                localStorage.removeItem('resetInfo');

                // Chuyển hướng về trang đăng nhập
                window.location.href = '/Login';
            } catch (error) {
                alert('Lỗi: ' + error.message);
                console.error('Error resetting password:', error);
            }
        });
    }

    // ---------- Xử lý thay đổi mật khẩu ----------
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
                return;
            }

            // Lấy thông tin user từ localStorage
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!userData || !userData.id || !userData.email) {
                alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                window.location.href = '/Login';
                return;
            }

            const { id, email } = userData;

            try {
                // Xác thực mật khẩu hiện tại
                const loginResponse = await fetch('http://localhost:8080/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email, password: currentPassword }),
                });

                if (!loginResponse.ok) {
                    alert('Mật khẩu hiện tại không đúng!');
                    return;
                }

                // Lấy thông tin người dùng từ backend
                const userResponse = await fetch(`http://localhost:8080/api/users/${id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!userResponse.ok) {
                    alert('Không thể lấy thông tin người dùng!');
                    return;
                }

                const user = await userResponse.json();

                // Cập nhật mật khẩu mới
                const updatedUser = { ...user, password: newPassword };

                // Gửi yêu cầu cập nhật
                const updateResponse = await fetch(`http://localhost:8080/api/users/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser),
                });

                if (updateResponse.ok) {
                    alert('Đổi mật khẩu thành công!');
                    // Cập nhật lại thông tin trong localStorage nếu cần
                    const updatedUserData = await updateResponse.json();
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                    changePasswordForm.reset();
                } else {
                    alert('Đổi mật khẩu thất bại!');
                }
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Đã xảy ra lỗi trong quá trình đổi mật khẩu!');
            }
        });

        // Kiểm tra đăng nhập khi tải trang cho trang thay đổi mật khẩu
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id || !userData.email) {
            alert('Vui lòng đăng nhập để đổi mật khẩu.');
            window.location.href = '/Login';
        }
    }
});
