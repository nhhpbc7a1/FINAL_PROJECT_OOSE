import express from 'express';
import dashboardService from '../../services/doctor-side-service/dashboard.service.js';

const router = express.Router();

// Middleware for layout and active sidebar item
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.active = 'dashboard'; // Set active menu item
    next();
});

router.get('/', async function (req, res) {
  try {
    // In production, you would get the doctorId from the session
    const doctorId = req.session.authUser?.doctorId || 2; // Fallback to ID 1 for testing
    
    // Fetch dashboard data and doctor profile
    const [dashboardData, doctorProfile] = await Promise.all([
      dashboardService.getDashboardData(doctorId),
      dashboardService.getDoctorProfile(doctorId)
    ]);
    
    res.render('vwDoctor/dashboard', { 
      dashboard: dashboardData,
      doctor: doctorProfile,
      calendarEvents: JSON.stringify(dashboardData.calendarEvents)
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('vwDoctor/dashboard', { error: 'Could not load dashboard data' });
  }
});

export default router; 