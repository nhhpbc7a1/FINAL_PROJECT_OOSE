import express from 'express';
import dashboardRouter from './dashboard.route.js';
import testRequestsRouter from './test_requests.route.js';
import testResultsRouter from './test_results.route.js';
import LabTechnician from '../../models/LabTechnician.js';
import TestResult from '../../models/TestResult.js';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'labtech';
    next();
});

// Sub-routes
router.use('/dashboard', dashboardRouter);
router.use('/test-requests', testRequestsRouter);
router.use('/test-results', testResultsRouter);

// Middleware to attach current lab technician to the request
router.use(async (req, res, next) => {
    try {
        if (req.session.user && req.session.user.roleId === 4) { // Role ID 4 for lab technicians
            const userId = req.session.user.userId;
            const labTechnician = await LabTechnician.findByUserId(userId);
            
            if (labTechnician) {
                req.labTechnician = labTechnician;
                res.locals.labTechnician = labTechnician;
            }
        }
        next();
    } catch (error) {
        console.error('Error loading lab technician data:', error);
        next();
    }
});

// GET: Lab technician profile
router.get('/profile', async (req, res) => {
    try {
        if (!req.labTechnician) {
            return res.redirect('/login');
        }
        
        // Get full lab technician details
        const technicianId = req.labTechnician.technicianId;
        const technician = await LabTechnician.findById(technicianId);
        
        if (!technician) {
            return res.status(404).render('vwLabTech/error', {
                message: 'Lab technician profile not found'
            });
        }
        
        // Get recent test results
        const recentResults = await TestResult.getRecentByTechnician(technicianId, 5);
        
        res.render('vwLabTech/profile', {
            technician,
            recentResults
        });
    } catch (error) {
        console.error('Error loading lab technician profile:', error);
        res.status(500).render('vwLabTech/error', {
            message: 'Failed to load profile: ' + error.message
        });
    }
});

// Default route
router.get('/', (req, res) => {
    res.redirect('/labtech/dashboard');
});

export default router;