import express from 'express';
import moment from 'moment';
import Appointment from '../../models/Appointment.js';
import Patient from '../../models/Patient.js';
import TestRequest from '../../models/TestRequest.js';
import Notification from '../../models/Notification.js';
import Doctor from '../../models/Doctor.js';
import Service from '../../models/Service.js';
import ServiceDAO from '../../dao/ServiceDAO.js';

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
      const appointmentDetails = await Appointment.findById(appointmentId);
      if (appointmentDetails) {
        // Get patient details separately since we don't have populate
        const patient = await Patient.findById(appointmentDetails.patientId);
        if (patient) {
          patientDetails = {
            patientId: patient.patientId,
            patientName: patient.fullName,
            patientGender: patient.gender,
            patientDob: patient.dob,
            patientAge: patient.dob 
              ? moment().diff(moment(patient.dob), 'years') 
              : 'Unknown',
            patientGenderFormatted: patient.gender === 'male' ? 'Male' : 'Female',
            appointmentId: appointmentId,
            patientAppointmentStatus: appointmentDetails.patientAppointmentStatus || 'examining'
          };
        }
      }
    }
    // Otherwise use the patient ID to get patient details
    else if (patientId) {
      const patient = await Patient.findById(patientId);
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
            
            if (mostRecentAppointmentId) {
              patientDetails = {
                patientId: patient._id,
                patientName: patient.fullName,
                patientGender: patient.gender,
                patientDob: patient.dob,
                patientAge: patient.dob 
                  ? moment().diff(moment(patient.dob), 'years') 
                  : 'Unknown',
                patientGenderFormatted: patient.gender === 'male' ? 'Male' : 'Female',
                appointmentId: mostRecentAppointmentId,
                patientAppointmentStatus: appointmentStatus
              };
            }
          }
        }
        
        if (!patientDetails) {
          patientDetails = {
            patientId: patient._id,
            patientName: patient.fullName,
            patientGender: patient.gender,
            patientDob: patient.dob,
            patientAge: patient.dob 
              ? moment().diff(moment(patient.dob), 'years') 
              : 'Unknown',
            patientGenderFormatted: patient.gender === 'male' ? 'Male' : 'Female',
            appointmentId: mostRecentAppointmentId,
            patientAppointmentStatus: appointmentStatus
          };
        }
      }
    }
    
    if (!patientDetails) {
      return res.redirect('/doctor/appointments');
    }
    
    // Get tests grouped by specialty instead of category
    const tests = await ServiceDAO.findActiveByType('test');
    
    // Group tests by specialty
    const testsBySpecialty = {};
    tests.forEach(test => {
      const specialtyName = test.specialtyName || 'General';
      if (!testsBySpecialty[specialtyName]) {
        testsBySpecialty[specialtyName] = [];
      }
      testsBySpecialty[specialtyName].push(test);
    });
    
    // Pass patient details and testsBySpecialty to the template
    res.render('vwDoctor/testRequestForm', { 
      patient: patientDetails,
      testRequestCode: `TR-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      testsByCategory: testsBySpecialty // Keep the same variable name for compatibility with the template
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
      appointment = await Appointment.findById(appointmentId);
      
      // If we found appointment, get related patient data
      if (appointment) {
        const patient = await Patient.findById(appointment.patientId);
        if (patient) {
          // Add patient info to appointment for using later
          appointment.patient = patient;
          appointment.patientName = patient.fullName;
        }
      }
    } 
    
    // If no appointment or couldn't find it, but we have patientId, create a virtual appointment context
    if ((!appointment || !appointmentId) && patientId) {
      virtualAppointment = true;
      
      // Get patient details
      const patient = await Patient.findById(patientId);
      
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
    const testRequest = new TestRequest({
      appointmentId: actualAppointmentId, // Use actual appointment ID if available
      serviceId: serviceId,
      requestDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      status: status || 'pending',
      notes: `Test request for ${testName}`,
      requestedByDoctorId: doctorId
    });
    
    // Add the test request to the database
    const requestId = await testRequest.save();
    
    // Send notifications
    try {
      // 1. Send notification to the patient
      if (appointment.patientId) {
        const patientData = await Patient.findById(appointment.patientId);
        if (patientData && patientData.userId) {
          const notification = new Notification({
            userId: patientData.userId,
            title: 'New lab test requested',
            content: `Your doctor has requested a ${testName} test. The lab team will process your request shortly.`,
            isRead: false,
            createdDate: new Date()
          });
          await notification.save();
        }
      }
      
      // 2. Send notification to lab technicians
      // For simplicity, we're sending to userId 6 which corresponds to a lab technician
      // In a real application, you would query for all lab technicians or specific ones based on the test type
      const labNotification = new Notification({
        userId: 6, // Lab technician userId
        title: 'New test request received',
        content: `Dr. ${appointment.doctorName} has requested a ${testName} test for patient ${appointment.patientName}.`,
        isRead: false,
        createdDate: new Date()
      });
      await labNotification.save();
      
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