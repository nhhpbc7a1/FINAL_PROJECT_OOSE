import express from 'express';
import moment from 'moment';
import dashboardService from '../../services/labtech/dashboard.service.js';
import labtechService from '../../services/lab-technician.service.js';


const router = express.Router();

// Dashboard route - Shows summary statistics and recent test request
router.get('/', async (req, res) => {
    try {
        res.locals.activeRoute = 'dashboard';
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        const technicianId = labTechnician.technicianId;
        
        // Get dashboard statistics using the service
        const stats = await dashboardService.getDashboardStats(technicianId);
        
        // Get recent test requests
        const recentRequests = await dashboardService.getRecentRequests(
            technicianId, 
            labTechnician.specialtyId
        );
        
        res.render('vwLabTech/dashboard', {
            pendingCount: stats.pendingCount,
            inProgressCount: stats.inProgressCount,
            completedCount: stats.completedCount,
            totalCount: stats.totalCount,
            recentRequests: recentRequests,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                }
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load dashboard data' 
        });
    }
});

// Get schedule data for the calendar
router.get('/schedule-data', async (req, res) => {
    try {
        console.log('Fetching schedule data...');
        // Get month and year from query parameters, default to current month
        const month = parseInt(req.query.month) || new Date().getMonth();
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const date = new Date(year, month, 1);
        
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await labtechService.findByUserId(userId);
        
        if (!labTechnician) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        
        const technicianId = labTechnician.technicianId;
        
        // Get schedule data for the month
        const scheduleData = await dashboardService.getScheduleData(technicianId, date);
        
        return res.json({
            success: true,
            scheduleData
        });
    } catch (error) {
        console.error('Error fetching schedule data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load schedule data'
        });
    }
});

export default router;  