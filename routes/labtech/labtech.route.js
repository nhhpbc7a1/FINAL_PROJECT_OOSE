import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    next();
});

// Route cho dashboard
router.get('/dashboard', async function (req, res) {
    res.render('vwLabtech/dashboard', {
        title: 'Lab Dashboard',
        activeRoute: 'dashboard'
    });
});

// Route cho work-statistics (dữ liệu tĩnh để hình dung giao diện)
router.get('/work-statistics', async function (req, res) {
    const stats = {
        completedToday: 5,
        pendingTests: 3,
        inProgress: 2
    };
    res.render('vwLabtech/work_statistics', {
        title: 'Work Statistics',
        activeRoute: 'work-statistics',
        completedToday: stats.completedToday,
        pendingTests: stats.pendingTests,
        inProgress: stats.inProgress
    });
});

// Route cho notifications (dữ liệu tĩnh để hình dung giao diện)
router.get('/notifications', async function (req, res) {
    const notifications = [
        { title: 'New Test Assigned', content: 'You have a new test to perform for patient John Doe.', isRead: false, createdDate: '2025-05-04' },
        { title: 'Test Result Update', content: 'Test result for patient Jane Smith has been updated.', isRead: true, createdDate: '2025-05-03' },
        { title: 'System Maintenance', content: 'System will be down for maintenance on 2025-05-05.', isRead: false, createdDate: '2025-05-02' }
    ];
    const unreadCount = 2; // Giả lập số lượng thông báo chưa đọc

    res.render('vwLabtech/notifications', {
        title: 'Notifications',
        activeRoute: 'notifications',
        notifications: notifications,
        unreadCount: unreadCount
    });
});

// Route mặc định redirect đến dashboard
router.get('/', async function (req, res) {
    res.redirect('/labtech/dashboard');
});

export default router;