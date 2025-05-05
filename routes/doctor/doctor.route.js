import express from 'express';
import patientListRouter from './patientList.route.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import dashboardService from '../../services/doctor-side-service/dashboard.service.js';
import moment from 'moment';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
  });

router.get('/',async function (req, res){
    res.redirect('/doctor/dashboard');
});

router.get('/dashboard', async function (req, res) {
  try {
    // In production, you would get the doctorId from the session
    const doctorId = req.session.authUser?.doctorId || 2; // Fallback to ID 1 for testing
    
    // Fetch dashboard data and doctor profile
    const [dashboardData, doctorProfile] = await Promise.all([
      dashboardService.getDashboardData(doctorId),
      dashboardService.getDoctorProfile(doctorId)
    ]);
    
    res.locals.active = 'dashboard'; // Set active menu item
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

router.get('/appointments', async function (req, res) {
  res.locals.active = 'appointments'; 
  res.render('vwDoctor/appointment');
});

// Use the patientList router for '/patients' path
router.use('/patients', patientListRouter);

router.get('/patient-details', async function (req, res) {
  try {
    // Get patient ID from query parameters
    const patientId = req.query.patientId || '';
    
    if (!patientId) {
      return res.redirect('/doctor/patients');
    }
    
    // Fetch patient details
    const patientDetails = await patientDetailsService.getPatientDetails(patientId);
    
    if (!patientDetails) {
      return res.redirect('/doctor/patients');
    }
    
    // Format dates for display
    const formattedPatient = {
      ...patientDetails,
      formattedDob: moment(patientDetails.dob || patientDetails.userDob).format('MMMM D, YYYY'),
      formattedLastVisit: patientDetails.lastVisit ? moment(patientDetails.lastVisit).format('MMM D, YYYY') : 'Not visited yet',
      patientCode: `P-${patientId.toString().padStart(8, '0')}`,
      appointments: patientDetails.appointments.map(appointment => ({
        ...appointment,
        formattedDate: moment(appointment.appointmentDate).format('MMM D, YYYY'),
        formattedTime: appointment.estimatedTime ? moment(appointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') : 'N/A'
      })),
      labResults: patientDetails.labResults.map(result => ({
        ...result,
        formattedDate: moment(result.performedDate).format('MMM D, YYYY')
      })),
      prescriptions: patientDetails.prescriptions.map(prescription => ({
        ...prescription,
        formattedDate: moment(prescription.prescriptionDate).format('MMM D, YYYY')
      }))
    };
    
    res.render('vwDoctor/patientDetails', { patient: formattedPatient });
  } catch (error) {
    console.error('Error loading patient details:', error);
    res.redirect('/doctor/patients');
  }
});

router.get('/appointment-detail', async function (req, res) {
  try {
    const patientId = req.query.patientId || '';
    
    if (!patientId) {
      return res.redirect('/doctor/patients');
    }
    
    // Fetch patient details for the appointment detail page
    const patientDetails = await patientDetailsService.getPatientDetails(patientId);
    
    if (!patientDetails) {
      return res.redirect('/doctor/patients');
    }
    
    // Format the patient object for display
    const patient = {
      patientId: patientDetails.patientId,
      fullName: patientDetails.fullName,
      age: patientDetails.age,
      gender: patientDetails.gender,
      patientCode: `P-${patientId.toString().padStart(8, '0')}`
    };
    
    // Format appointments for display with additional year property for filtering
    const appointments = patientDetails.appointments.map(appointment => ({
      ...appointment,
      formattedDate: moment(appointment.appointmentDate).format('MMM D, YYYY'),
      formattedTime: appointment.estimatedTime ? moment(appointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') : 'N/A',
      year: moment(appointment.appointmentDate).format('YYYY')
    }));
    
    res.render('vwDoctor/appointmentDetail', { 
      patient,
      appointments,
      appointmentsCount: appointments.length
    });
  } catch (error) {
    console.error('Error loading appointment details:', error);
    res.redirect('/doctor/patients');
  }
});

router.get('/examination', async function (req, res) {
  const patientId = req.query.patientId || '';
  res.render('vwDoctor/examination', { patientId });
});

router.get('/test-request', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';
  
  // In a real application, you would fetch patient data from database using this ID
  // and pass it to the template
  
  // Pass patientId to the template
  res.render('vwDoctor/testRequestForm', { patientId });
});

router.get('/prescription-medicine', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';
  
  // In a real application, you would fetch patient data from database using this ID
  // and pass it to the template
  
  // Pass patientId to the template
  res.render('vwDoctor/prescriptionMedicine', { patientId });
});

router.get('/messages', async function (req, res) {
  res.locals.active = 'messages'; // Set active menu item

  res.redirect('/doctor/dashboard');
});

router.get('/schedule', async function (req, res) {
  res.locals.active = 'appointments'; 
  res.redirect('/doctor/appointments');
});

export default router;