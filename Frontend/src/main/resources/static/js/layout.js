document.addEventListener('DOMContentLoaded', () => {
    updateUserGreeting();
    checkNotificationBadge();

});

function updateUserGreeting() {
    const user = JSON.parse(localStorage.getItem('user'));
    const greetingElement = document.querySelector('.user-greeting');
    if (user && user.fullName) {
        greetingElement.textContent = ` ${user.fullName}`;
    }
}
function checkNotificationBadge() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return;

    fetch('http://localhost:8080/api/notifications')
        .then(res => res.json())
        .then(data => {
            // Lấy các thông báo của user, status active và chưa đọc
            const unreadNoti = data.filter(n => n.user === user.id && n.notificationsStatus === 'active' && !n.isRead);

            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (unreadNoti.length > 0) {
                    badge.textContent = unreadNoti.length;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(err => console.error('Badge error:', err));
}


