import express from 'express';
import Appointment from '../../models/Appointment.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'appointments'; // Set current route highlight
    next();
});

// GET: Display list of appointments
router.get('/', async function (req, res) {
  try {
    const searchQuery = req.query.search || '';
    const statusFilter = req.query.status || '';
    
    // Get all appointments
    let appointments = await Appointment.findAll();
    
    // Apply status filter if provided
    if (statusFilter) {
      appointments = appointments.filter(appt => 
        appt.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search filter if provided (client-side search will handle this, but we can also do it server-side)
    if (searchQuery) {
      appointments = appointments.filter(appt => 
        (appt.patientName && appt.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (appt.doctorName && appt.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (appt.specialtyName && appt.specialtyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (appt.patientPhone && appt.patientPhone.includes(searchQuery))
      );
    }

    // Format data for display
    appointments = appointments.map(appointment => ({
      ...appointment,
      // Format dates for display
      formattedAppointmentDate: appointment.appointmentDate,
      // Add any additional formatting needed
    }));

    // Get status counts for filters
    const statusCounts = await Appointment.countByStatus();

    res.render('vwAdmin/manage_appointment/appointment_list', {
      appointments,
      totalAppointments: appointments.length,
      searchQuery,
      statusFilter,
      statusCounts
    });
  } catch (error) {
    console.error('Error loading appointments:', error);
    res.render('vwAdmin/manage_appointment/appointment_list', { 
      error: 'Failed to load appointments',
      appointments: [] 
    });
  }
});

// GET: Display details for a single appointment
router.get('/view/:appointmentId', async function (req, res) {
    try {
        res.locals.pageTitle = 'View Appointment Details';
        const appointmentId = parseInt(req.params.appointmentId, 10);

        if (isNaN(appointmentId)) {
            return res.redirect('/admin/manage_appointment');
        }

        // Get appointment with services
        const appointment = await Appointment.getWithServices(appointmentId);

        if (!appointment) {
            return res.redirect('/admin/manage_appointment');
        }

        // Format for display
        const appointmentData = {
            ...appointment,
            // Add any additional formatting or computed properties
        };

        res.render('vwAdmin/manage_appointment/view_appointment', {
            appointment: appointmentData
        });

    } catch (error) {
        console.error(`Error loading appointment view for ID ${req.params.appointmentId}:`, error);
        res.render('vwAdmin/manage_appointment/appointment_list', { 
            error: 'Failed to load appointment details.',
            appointments: [] 
        });
    }
});

export default router; 