import express from 'express';
import dashboardRouter from './dashboard.route.js';
import appointmentRouter from './appointment.route.js';
import examinationRouter from './examination.route.js';
import testRequestRouter from './test-request.route.js';
import prescriptionRouter from './prescription.route.js';
import messageRouter from './message.route.js';
import patientDetailsRouter from './patient-details.route.js';
import scheduleRouter from './schedule.route.js';
import Patient from '../../models/Patient.js';
import Doctor from '../../models/Doctor.js';
import Notification from '../../models/Notification.js';
import moment from 'moment';

const router = express.Router();

// Middleware to add notifications count to all doctor routes
router.use(async (req, res, next) => {
  try {
    // Get the userId from session or use default for testing
    const userId = req.session.authUser?.userId || ""; 
    
    // Get unread count if we have a valid userId
    let unreadCount = 0;
    if (userId) {
      unreadCount = await Notification.countUnreadByUserId(userId);
    }
    
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

// Create a new patients route directly here
router.get('/patients', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Get doctor ID from session
    const doctorId = req.session.authUser?.doctorId;
    
    // Check if doctor is logged in
    if (!doctorId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found`);
    }
    
    // Get patients with their latest appointments for this doctor
    const patients = await Patient.findByDoctorWithLastVisit(doctorId);
    
    console.log(`Found ${patients.length} patients for doctor ID ${doctorId}`);
    // Add debug for patient status
    if (patients.length > 0) {
      console.log('Sample patient data:', {
        patientId: patients[0].patientId,
        fullName: patients[0].fullName,
        appointmentStatus: patients[0].appointmentStatus || 'no status'
      });
    }

    // Calculate age for each patient and format dates
    const patientsWithAge = patients.map(patient => {
      // Calculate age
      const dob = new Date(patient.dob);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      
      // Format the last visit date if available
      let lastVisitFormatted = 'Not visited yet';
      if (patient.lastVisitDate) {
        const lastVisit = new Date(patient.lastVisitDate);
        const today = new Date();
        const isToday = lastVisit.toDateString() === today.toDateString();
        
        if (isToday) {
          lastVisitFormatted = `Today, ${lastVisit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          lastVisitFormatted = lastVisit.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      // Get appointment status from database or set default
      let appointmentStatus = patient.appointmentStatus || 'no-appointments';
      
      return {
        ...patient,
        age,
        lastVisitFormatted,
        appointmentStatus
      };
    });
    
    console.log(`Processed ${patientsWithAge.length} patients for doctor ID ${doctorId}`);

    res.render('vwDoctor/patient', {
      patients: patientsWithAge,
      totalPatients: patients.length
    });
  } catch (error) {
    console.error('Error loading patients:', error);
    res.render('vwDoctor/patient', { error: 'Failed to load patients' });
  }
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
router.use('/examination', examinationRouter);
router.use('/test-request', testRequestRouter);
router.use('/prescription', prescriptionRouter);
router.use('/messages', messageRouter);
router.use('/patient-details', patientDetailsRouter);
router.use('/schedule', scheduleRouter);

export default router;