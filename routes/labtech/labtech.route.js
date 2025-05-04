// routes/labtech/labtech.route.js
import express from 'express';
//import { getWorkStats } from '../../ultis/db.js';
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

// Route cho work-statistics
router.get('/work-statistics', async function (req, res) {
    // Dữ liệu mẫu trực tiếp
    const stats = {
        completedToday: 25,
        pendingTests: 12,
        inProgress: 3
    };
    res.render('vwLabtech/work_statistics', {
        title: 'Work Statistics',
        activeRoute: 'work-statistics', // Đảm bảo truyền activeRoute
        completedToday: stats.completedToday,
        pendingTests: stats.pendingTests,
        inProgress: stats.inProgress
    });
});

// Route mặc định redirect đến dashboard
router.get('/', async function (req, res) {
    res.redirect('/labtech/dashboard');
});

export default router;