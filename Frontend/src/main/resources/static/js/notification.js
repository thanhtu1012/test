
document.addEventListener('DOMContentLoaded', () => {
    loadNotifications();
    checkNotificationBadge();
});

function loadNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        alert('Vui lòng đăng nhập lại!');
        return;
    }

    fetch('http://localhost:8080/api/notifications')
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải thông báo');
            return response.json();
        })
        .then(notifications => {
            const container = document.getElementById('notificationList');
            container.innerHTML = '';

            // Lọc thông báo của user có trạng thái "active"
            const userNotifications = notifications.filter(n => n.user === user.id && n.notificationsStatus === 'active');

            if (userNotifications.length === 0) {
                container.innerHTML = '<p>Không có thông báo nào.</p>';
                return;
            }

            userNotifications.forEach(notification => {
                console.log('Notification object:', notification);
                const card = document.createElement('div');
                card.classList.add('notification-card');

                // Nếu đã đọc rồi thì border xanh lá, chưa thì xanh dương
                if (notification.isRead) {
                    card.style.borderLeft = '5px solid #80cc2b'; // xanh lá
                } else {
                    card.style.borderLeft = '5px solid #007bff'; // xanh dương
                }

                card.innerHTML = `
                    <div class="notification-header">
                    <i class="${notification.isRead ? 'fas fa-check-circle' : 'fas fa-info-circle'}" style="color: ${notification.isRead ? 'green' : 'blue'} !important;"></i>

                        <span>${formatDate(notification.createdAt)}</span>
                    </div>
                    <div class="notification-body">
                        <p>${notification.message}</p>
                    </div>
                `;



                // Nút "Đánh dấu đã đọc"
                const btnMarkRead = document.createElement('button');
                btnMarkRead.classList.add('mark-read-btn');

                if (notification.isRead) {
                    btnMarkRead.textContent = 'Đã xem';
                    btnMarkRead.disabled = true;
                } else {
                    btnMarkRead.textContent = 'Đánh dấu đã đọc';
                    btnMarkRead.addEventListener('click', () => {
                        markAsRead(notification, card, btnMarkRead);
                    });
                }

                card.appendChild(btnMarkRead);
                container.appendChild(card);
            });

        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể tải danh sách thông báo');
        });
}

function formatDate(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN');
}

function markAsRead(notification, cardElement, buttonElement) {
    const updatedNotification = {
        id: notification.id,
        user: { id: notification.user },
        message: notification.message,
        isRead: true,
        createdAt: notification.createdAt,
        notificationsStatus: notification.notificationsStatus
    };

    console.log('Updating notification:', updatedNotification); // DEBUG

    fetch(`http://localhost:8080/api/notifications/${notification.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedNotification)
    })
        .then(response => {
            if (!response.ok) throw new Error('Không thể cập nhật trạng thái thông báo');
            return response.json();
        })
        .then(() => {
            buttonElement.textContent = 'Đã xem';
            buttonElement.disabled = true;
            cardElement.style.borderLeft = '5px solid #80cc2b';
            decrementBadge();
        })
        .catch(err => {
            console.error('Lỗi đánh dấu đã đọc:', err);
            alert('Không thể cập nhật trạng thái thông báo');
        });
}



function decrementBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        let count = parseInt(badge.textContent);
        count = count > 0 ? count - 1 : 0;
        if (count === 0) {
            badge.style.display = 'none';
        } else {
            badge.textContent = count;
        }
    }
}

function checkNotificationBadge() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    fetch('http://localhost:8080/api/notifications')
        .then(res => res.json())
        .then(data => {
            const activeNoti = data.filter(n => n.user === user.id && n.notificationsStatus === 'active');
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (activeNoti.length > 0) {
                    badge.textContent = activeNoti.length;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(err => console.error('Badge error:', err));
}
