import express from 'express';
import moment from 'moment';
import appointmentService from '../../services/doctor-side-service/appointment.service.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import testRequestService from '../../services/doctor-side-service/test-request.service.js';
import doctorNotificationService from '../../services/doctor-side-service/doctorNotification.service.js';

const router = express.Router();

// Middleware for layout
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
});

// Route for redirecting to the test request form
router.get('/request', function (req, res) {
  // Simply redirect to /test-request with the same query parameters
  const patientId = req.query.patientId || '';
  const appointmentId = req.query.appointmentId || '';
  
  // Build the redirect URL
  let redirectUrl = '/doctor/test-request';
  if (patientId) {
    redirectUrl += `?patientId=${patientId}`;
    if (appointmentId) {
      redirectUrl += `&appointmentId=${appointmentId}`;
    }
  } else if (appointmentId) {
    redirectUrl += `?appointmentId=${appointmentId}`;
  }
  
  res.redirect(redirectUrl);
});

router.get('/', async function (req, res) {
  try {
    // Get patient ID from query parameters
    const patientId = req.query.patientId || '';
    const appointmentId = req.query.appointmentId || '';
    if (!patientId && !appointmentId) {
      return res.redirect('/doctor/appointments');
    }
    let patientDetails = null;
    // If we have an appointment ID, get patient details from the appointment
    if (appointmentId) {
      const appointmentDetails = await appointmentService.getAppointmentWithServices(appointmentId);
      if (appointmentDetails) {
        patientDetails = {
          patientId: appointmentDetails.patientId,
          patientName: appointmentDetails.patientName,
          patientGender: appointmentDetails.patientGender,
          patientDob: appointmentDetails.patientDob,
          patientAge: appointmentDetails.patientDob 
            ? moment().diff(moment(appointmentDetails.patientDob), 'years') 
            : 'Unknown',
          patientGenderFormatted: appointmentDetails.patientGender === 'male' ? 'Male' : 'Female',
          appointmentId: appointmentId,
          patientAppointmentStatus: appointmentDetails.patientAppointmentStatus || 'examining'
        };
      }
    }
    // Otherwise use the patient ID to get patient details
    else if (patientId) {
      const patient = await patientDetailsService.getPatientDetails(patientId);
      if (patient) {
        // Find the most recent appointment for this patient if available
        let mostRecentAppointmentId = null;
        let appointmentStatus = 'examined'; // Default status
        
        if (patient.appointments && patient.appointments.length > 0) {
          const sortedAppointments = [...patient.appointments].sort((a, b) => {
            return new Date(b.appointmentDate) - new Date(a.appointmentDate);
          });
          
          // Use the most recent appointment ID when creating lab requests
          if (sortedAppointments[0]) {
            mostRecentAppointmentId = sortedAppointments[0].appointmentId;
            appointmentStatus = sortedAppointments[0].patientAppointmentStatus || 'examined';
          }
        }
        
        patientDetails = {
          patientId: patient.patientId,
          patientName: patient.fullName,
          patientGender: patient.gender,
          patientDob: patient.dob,
          patientAge: patient.dob 
            ? moment().diff(moment(patient.dob), 'years') 
            : 'Unknown',
          patientGenderFormatted: patient.gender === 'male' ? 'Male' : 'Female',
          appointmentId: mostRecentAppointmentId, // Set the most recent appointment ID
          patientAppointmentStatus: appointmentStatus
        };
      }
    }
    if (!patientDetails) {
      return res.redirect('/doctor/appointments');
    }
    
    // Get dynamic test categories
    const testsByCategory = await testRequestService.getAllActiveTestsByCategory();
    // Pass patient details and testsByCategory to the template
    res.render('vwDoctor/testRequestForm', { 
      patient: patientDetails,
      testRequestCode: `TR-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      testsByCategory
    });
  } catch (error) {
    console.error('Error loading test request form:', error);
    res.redirect('/doctor/appointments');
  }
});

// Add the test request submission endpoint
router.post('/submit', async function(req, res) {
  try {
    const { appointmentId, patientId, serviceId, testName, status } = req.body;
    
    // Check if we have at least an appointmentId or patientId
    if ((!appointmentId && !patientId) || !serviceId) {
      return res.status(400).send('appointmentId/patientId and serviceId are required');
    }
    
    let appointment;
    let virtualAppointment = false;
    let actualAppointmentId = appointmentId;
    
    // Get the appointment details to get doctor and patient information
    if (appointmentId) {
      appointment = await appointmentService.getAppointmentWithServices(appointmentId);
    } 
    
    // If no appointment or couldn't find it, but we have patientId, create a virtual appointment context
    if ((!appointment || !appointmentId) && patientId) {
      virtualAppointment = true;
      
      // Get patient details
      const patient = await patientDetailsService.getPatientDetails(patientId);
      
      if (!patient) {
        return res.status(404).send('Patient not found');
      }
      
      // Create a virtual appointment object with minimal required info
      appointment = {
        appointmentId: `virtual-${Date.now()}`, // Virtual ID that won't be stored
        patientId: patientId,
        patientName: patient.fullName,
        doctorId: req.session.authUser?.doctorId, // Use logged in doctor
        doctorName: req.session.authUser?.fullName || 'Doctor'
      };
      
      // Try to find the most recent real appointment for this patient to use its ID
      if (patient.appointments && patient.appointments.length > 0) {
        const sortedAppointments = [...patient.appointments].sort((a, b) => {
          return new Date(b.appointmentDate) - new Date(a.appointmentDate);
        });
        
        if (sortedAppointments[0] && sortedAppointments[0].appointmentId) {
          actualAppointmentId = sortedAppointments[0].appointmentId;
          virtualAppointment = false; // We found a real appointment to use
        }
      }
    }
    
    if (!appointment) {
      return res.status(404).send('Appointment not found and could not create virtual appointment');
    }
    
    // Get the doctorId from the session
    const doctorId = req.session.authUser?.doctorId;
    
    // Check if doctor is logged in
    if (!doctorId) {
      return res.status(401).send('You must be logged in as a doctor to create test requests');
    }
    
    // Create the test request object
    const testRequest = {
      appointmentId: actualAppointmentId, // Use actual appointment ID if available
      serviceId: serviceId,
      requestDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      status: status || 'pending',
      notes: `Test request for ${testName}`,
      requestedByDoctorId: doctorId
    };
    
    // Add the test request to the database
    const requestId = await testRequestService.add(testRequest);
    
    // Send notifications
    try {
      // 1. Send notification to the patient
      if (appointment.patientId) {
        const patientData = await patientDetailsService.getPatientBasicInfo(appointment.patientId);
        if (patientData && patientData.userId) {
          await doctorNotificationService.sendNotification(
            patientData.userId,
            'New lab test requested',
            `Your doctor has requested a ${testName} test. The lab team will process your request shortly.`
          );
        }
      }
      
      // 2. Send notification to lab technicians
      // For simplicity, we're sending to userId 6 which corresponds to a lab technician
      // In a real application, you would query for all lab technicians or specific ones based on the test type
      await doctorNotificationService.sendNotification(
        6, // Lab technician userId
        'New test request received',
        `Dr. ${appointment.doctorName} has requested a ${testName} test for patient ${appointment.patientName}.`
      );
      
    } catch (notificationError) {
      console.error('Error sending notifications for test request:', notificationError);
      // We don't want to fail the test request submission if notifications fail
    }
    
    // Redirect back to examination page with success message or patient details if virtual
    req.session.testRequestSuccess = `Test request for ${testName} created successfully`;
    
    if (virtualAppointment || !actualAppointmentId) {
      res.redirect(`/doctor/patient-details?patientId=${appointment.patientId}`);
    } else {
      res.redirect(`/doctor/examination?appointmentId=${actualAppointmentId}`);
    }
    
  } catch (error) {
    console.error('Error submitting test request:', error);
    res.status(500).send('Failed to create test request: ' + error.message);
  }
});

export default router; 