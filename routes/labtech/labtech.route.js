import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    next();
});

router.get('/', async function (req, res) {
    res.render('vwLabtech/pending_test', {
        title: 'Pending Test List',
        activeRoute: 'pending'
    });
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
    const unreadCount = 2;

    res.render('vwLabtech/notifications', {
        title: 'Notifications',
        activeRoute: 'notifications',
        notifications: notifications,
        unreadCount: unreadCount
    });
});

// Route cho test-requests (dữ liệu tĩnh để hình dung giao diện)
router.get('/test-requests', async function (req, res) {
    const testRequests = [
        { testId: 1, patientName: 'John Doe', testType: 'Blood Test', status: 'in_progress', requestDate: '2025-05-01' },
        { testId: 2, patientName: 'Jane Smith', testType: 'Urine Test', status: 'done', requestDate: '2025-05-02' },
        { testId: 3, patientName: 'Michael Brown', testType: 'X-Ray', status: 'incomplete', requestDate: '2025-05-03' },
        { testId: 4, patientName: 'Sarah Davis', testType: 'MRI', status: 'decline', requestDate: '2025-05-04' },
        { testId: 5, patientName: 'David Wilson', testType: 'Blood Test', status: 'in_progress', requestDate: '2025-05-05' }
    ];

    res.render('vwLabtech/test_requests', {
        title: 'Test Requests',
        activeRoute: 'test-requests',
        testRequests: testRequests
    });
});

// Route cho test-results-entry (dữ liệu tĩnh để hình dung giao diện)
router.get('/test-results-entry/:resultId', async function (req, res) {
    const resultId = req.params.resultId;
    const testRequest = {
        testId: resultId,
        patientName: 'John Doe',
        testType: 'Blood Test',
        status: 'in_progress',
        requestDate: '2025-05-01',
        description: 'Complete blood count (CBC) to check for anemia.'
    };

    res.render('vwLabtech/test_results_entry', {
        title: 'Test Results Entry',
        activeRoute: 'test-results-entry',
        testRequest: testRequest
    });
});

// Route mặc định redirect đến dashboard
router.get('/', async function (req, res) {
    res.redirect('/labtech/dashboard');
});

export default router;