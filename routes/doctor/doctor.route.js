import express from 'express';
import patientListRouter from './patientList.route.js';
import dashboardRouter from './dashboard.route.js';
import appointmentRouter from './appointment.route.js';
import examinationRouter from './examination.route.js';
import testRequestRouter from './test-request.route.js';
import prescriptionRouter from './prescription.route.js';
import messageRouter from './message.route.js';
import patientDetailsRouter from './patient-details.route.js';
import scheduleRouter from './schedule.route.js';
import notificationService from '../../services/notification.service.js';

const router = express.Router();

// Middleware to add notifications count to all doctor routes
router.use(async (req, res, next) => {
  try {
    // Get the userId from session or use default for testing
    const userId = req.session.authUser?.userId || ""; 
    
    // Get unread count
    const unreadCount = await notificationService.countUnreadByUser(userId);
    
    // Add to locals for use in templates
    res.locals.unreadCount = unreadCount;
    
    next();
  } catch (error) {
    console.error('Error getting notification count:', error);
    next();
  }
});

// Set the layout for all doctor routes
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
  });

// Home route redirect to dashboard
router.get('/', function (req, res) {
    res.redirect('/doctor/dashboard');
});

// Redirects for backward compatibility with old routes
router.get('/appointment-detail', (req, res) => {
  res.redirect(`/doctor/appointments/detail?${new URLSearchParams(req.query).toString()}`);
});

router.get('/request-test', (req, res) => {
  res.redirect(`/doctor/test-request/request?${new URLSearchParams(req.query).toString()}`);
});

router.get('/prescription-medicine', (req, res) => {
  res.redirect(`/doctor/prescription/medicine?${new URLSearchParams(req.query).toString()}`);
});

router.post('/prescription-save', (req, res) => {
  // Forward the POST request to the new endpoint
  res.redirect(307, '/doctor/prescription/save');
});

router.get('/prescription-history', (req, res) => {
  res.redirect(`/doctor/prescription/history?${new URLSearchParams(req.query).toString()}`);
});

// Legacy API routes that need to be redirected
router.get('/api/medications', (req, res) => {
  res.redirect(`/doctor/prescription/api/medications?${new URLSearchParams(req.query).toString()}`);
});

router.get('/api/patients/:patientId/medical-records', (req, res) => {
  res.redirect(`/doctor/examination/api/patients/${req.params.patientId}/medical-records?${new URLSearchParams(req.query).toString()}`);
});

router.get('/api/patients/:patientId/appointments', (req, res) => {
  res.redirect(`/doctor/appointments/api/patients/${req.params.patientId}?${new URLSearchParams(req.query).toString()}`);
});

router.get('/api/debug/medical-records', (req, res) => {
  res.redirect('/doctor/examination/api/debug/medical-records');
});

// Use the separated route files
router.use('/dashboard', dashboardRouter);
router.use('/appointments', appointmentRouter);
router.use('/patients', patientListRouter);
router.use('/examination', examinationRouter);
router.use('/test-request', testRequestRouter);
router.use('/prescription', prescriptionRouter);
router.use('/messages', messageRouter);
router.use('/patient-details', patientDetailsRouter);
router.use('/schedule', scheduleRouter);

export default router;