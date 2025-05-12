import express from 'express';
import dashboardRouter from './dashboard.route.js';
import testRequestsRouter from './test_requests.route.js';
import testResultsRouter from './test_results.route.js';
import labtechService from '../../services/lab-technician.service.js';
import testResultsService from '../../services/labtech/test_results.service.js';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    next();
});

// Add route to check if lab technician has active schedule
router.get('/active-schedule-status', async (req, res) => {
    try {
        // Get logged in lab technician
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.status(401).json({ hasActiveSchedule: false });
        }
        
        // Check if lab technician has an active schedule
        const hasActiveSchedule = await testResultsService.hasActiveSchedule(labTechnician.technicianId);
        
        return res.json({ hasActiveSchedule });
    } catch (error) {
        console.error('Error checking active schedule status:', error);
        return res.status(500).json({ hasActiveSchedule: false, error: 'Failed to check active schedule status' });
    }
});

// Use the imported routers
router.use('/dashboard', dashboardRouter);
router.use('/test-requests', testRequestsRouter);
router.use('/test-results', testResultsRouter);

// Default route redirects to dashboard
router.get('/', async function (req, res) {
    res.redirect('/labtech/dashboard');
});

export default router;