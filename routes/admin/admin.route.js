import express from 'express';
import AdminDashboard from '../../models/AdminDashboard.js';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'dashboard'; // Default route
    // Handle flash messages
    if (req.session.flashMessage) {
        res.locals.flashMessage = req.session.flashMessage;
        delete req.session.flashMessage; // Clear after displaying
    }
    next();
});

router.get('/',async function (_, res){
    res.locals.currentRoute = 'dashboard';
    res.redirect('/admin/dashboard');
});

router.get('/dashboard', async function (req, res) {
    try {
        // Set current route as dashboard
        res.locals.currentRoute = 'dashboard';
        
        // Get dashboard statistics using the AdminDashboard model
        const dashboardModel = await AdminDashboard.getDashboardStats();
        
        // Get appointment chart data
        const appointmentData = await AdminDashboard.getAppointmentChartData();
        
        // Get specialty distribution data
        const specialtyData = await AdminDashboard.getSpecialtyDistribution();

        // Get active doctors data
        const activeDoctors = await AdminDashboard.getActiveDoctors();

        // Get popular services data
        const popularServices = await AdminDashboard.getPopularServices();
        
        // Prepare data for template
        const templateData = {
            ...dashboardModel, // spread all properties from the dashboard model
            appointmentLabels: appointmentData.labels,
            completedAppointments: appointmentData.completed,
            cancelledAppointments: appointmentData.cancelled,
            specialtyLabels: specialtyData.labels,
            specialtyData: specialtyData.data,
            activeDoctors,
            popularServices
        };
        
        // Render the dashboard page with data
        res.render('vwAdmin/dashboard', templateData);
    } catch (error) {
        console.error('Dashboard error:', error);
        req.session.flashMessage = {
            type: 'danger',
            message: 'Unable to load Dashboard data. Please try again later.'
        };
        res.redirect('/admin');
    }
});

// API endpoint for appointment chart data
router.get('/dashboard/appointments', async function (req, res) {
    try {
        const months = parseInt(req.query.months) || 6;
        const data = await AdminDashboard.getAppointmentChartData(months);
        res.json(data);
    } catch (error) {
        console.error('Error fetching appointment chart data:', error);
        res.status(500).json({ error: 'Unable to load appointment chart data' });
    }
});

// Các route khác của admin sẽ được thêm vào đây

import manageSpecialtyRouter from './manage_specialty.route.js'
router.use('/manage_specialty', manageSpecialtyRouter);

import manageDoctorRouter from './manage_doctor.route.js'
router.use('/manage_doctor', manageDoctorRouter);

import manageLabtechRouter from './manage_labtech.route.js'
router.use('/manage_labtech', manageLabtechRouter);

import manageMedicationRouter from './manage_medication.route.js'
router.use('/manage_medication', manageMedicationRouter);

import manageServiceRouter from './manage_service.route.js'
router.use('/manage_service', manageServiceRouter);

import manageRoomRouter from './manage_room.route.js'
router.use('/manage_room', manageRoomRouter);

import managePatientRouter from './manage_patient.route.js'
router.use('/manage_patient', managePatientRouter);

import manageAppointmentRouter from './manage_appointment.route.js'
router.use('/manage_appointment', manageAppointmentRouter);

import scheduleRouter from './schedule.route.js'
router.use('/schedule', scheduleRouter);

export default router;

