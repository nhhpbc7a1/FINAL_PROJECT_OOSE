import express from 'express';
import moment from 'moment';
import appointmentService from '../../services/doctor-side-service/appointment.service.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import doctorMedicalRecordService from '../../services/doctor-side-service/medical-record.service.js';
import doctorNotificationService from '../../services/doctor-side-service/doctorNotification.service.js';

const router = express.Router();

// Middleware for layout
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
});

router.get('/', async function (req, res) {
  try {
    // Get appointment ID from query parameters
    const appointmentId = req.query.appointmentId || '';
    
    if (!appointmentId) {
      return res.redirect('/doctor/appointments');
    }
    
    // Fetch appointment details with patient information
    const appointmentDetails = await appointmentService.getAppointmentWithServices(appointmentId);
    
    if (!appointmentDetails) {
      return res.redirect('/doctor/appointments');
    }
    
    // Format the appointment data for display
    const formattedAppointment = {
      ...appointmentDetails,
      timeFormatted: appointmentDetails.estimatedTime 
        ? moment(appointmentDetails.estimatedTime, 'HH:mm:ss').format('hh:mm A') 
        : 'N/A',
      dateFormatted: moment(appointmentDetails.appointmentDate).format('MMMM D, YYYY'),
      timeRangeFormatted: appointmentDetails.estimatedTime 
        ? `${moment(appointmentDetails.estimatedTime, 'HH:mm:ss').format('hh:mm A')} - ${moment(appointmentDetails.estimatedTime, 'HH:mm:ss').add(30, 'minutes').format('hh:mm A')}`
        : 'Not specified',
      patientGenderFormatted: appointmentDetails.patientGender === 'male' ? 'Male' : 'Female',
      patientAge: appointmentDetails.patientDob 
        ? moment().diff(moment(appointmentDetails.patientDob), 'years') 
        : 'Unknown',
      examinationCode: `EX-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    console.log(`Examination for appointment ${appointmentId} - Room: ${appointmentDetails.roomNumber || 'Not assigned'}`);
    
    // Update appointment status to examining if it's currently waiting
    if (appointmentDetails.patientAppointmentStatus === 'waiting') {
      await appointmentService.updatePatientAppointmentStatus(appointmentId, 'examining');
      formattedAppointment.patientAppointmentStatus = 'examining';
    }
    
    // Get success message from session if it exists
    const successMessage = req.session.testRequestSuccess || null;
    
    // Clear the success message from session to avoid showing it again on refresh
    if (req.session.testRequestSuccess) {
      delete req.session.testRequestSuccess;
    }
    
    // Render the examination page with appointment and patient data
    res.render('vwDoctor/examination', { 
      appointment: formattedAppointment,
      successMessage: successMessage
    });
  } catch (error) {
    console.error('Error loading examination data:', error);
    res.redirect('/doctor/appointments');
  }
});

// POST endpoint to handle examination form submission
router.post('/submit', async function (req, res) {
  try {
    const { 
      appointmentId, 
      diagnosis,
      notes,
      recommendations,
      followupDate
    } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' });
    }
    
    // Log received data
    console.log(`Received examination data for appointmentId ${appointmentId}`);
    
    // Get appointment details to find the patient
    const appointmentDetails = await appointmentService.findById(appointmentId);
    if (!appointmentDetails) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Check if the appointment is already examined
    if (appointmentDetails.patientAppointmentStatus === 'examined') {
      return res.status(400).json({ 
        success: false, 
        message: 'This appointment has already been completed.',
        code: 'ALREADY_EXAMINED'
      });
    }
    
    // Create medical record object with all fields from the form
    const recordData = {
      appointmentId,
      diagnosis: diagnosis || '',
      notes: notes || '',
      recommendations: recommendations || '',
      followupDate: followupDate || null
    };
    
    // Add medical record to database using the doctor-side service
    const recordId = await doctorMedicalRecordService.createExaminationRecord(recordData);
    console.log(`Created medical record with ID ${recordId}`);
    
    // Update the appointment status to "examined"
    await appointmentService.updatePatientAppointmentStatus(appointmentId, 'examined');
    console.log(`Updated appointment ${appointmentId} status to "examined"`);
    
    // Send notification to the patient
    try {
      const patientData = await patientDetailsService.getPatientBasicInfo(appointmentDetails.patientId);
      if (patientData && patientData.userId) {
        // Use doctorNotification service to send notification
        const notificationResult = await doctorNotificationService.sendNotification(
          patientData.userId,
          'Medical examination completed',
          `Your examination on ${moment(appointmentDetails.appointmentDate).format('MMMM D, YYYY')} has been completed. Please check your medical records.`
        );
        
        if (notificationResult.success) {
          console.log(`Notification sent to patient (userId: ${patientData.userId})`);
        } else {
          console.log(`Failed to send notification: ${notificationResult.message}`);
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // We don't want to fail the examination submission if notification fails
    }
    
    res.json({ 
      success: true, 
      recordId,
      message: 'Examination record created successfully' 
    });
  } catch (error) {
    console.error('Error submitting examination:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create examination record: ' + error.message
    });
  }
});

// API route to get patient medical records
router.get('/api/patients/:patientId/medical-records', async function (req, res) {
  try {
    const patientId = req.params.patientId;
    console.log(patientId);
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    console.log(`Fetching medical records for patient ID: ${patientId}`);
    
    // Get medical records for the patient using doctor-side service
    const records = await doctorMedicalRecordService.getPatientMedicalRecordsForAPI(patientId);
    
    console.log(`Retrieved ${records.length} medical records from service`);
    
    // Format records for the frontend with safe date handling
    const formattedRecords = records.map(record => ({
      ...record,
      dateFormatted: record.createdAt ? moment(record.createdAt).format('MMM D, YYYY') : 'Unknown date',
      doctorName: record.doctorName || 'Unknown',
      title: record.title || `Medical Record #${record.id}`,
      department: record.specialtyName || 'General Medicine'
    }));
    
    // Return the records, even if empty
    res.json({ 
      records: formattedRecords,
      count: formattedRecords.length
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ 
      error: 'Failed to load medical records',
      message: error.message,
      records: [] 
    });
  }
});

// Debug endpoint to check medical records
router.get('/api/debug/medical-records', async function (req, res) {
  try {
    // Check if MedicalRecord table has data
    const debug = await doctorMedicalRecordService.debugCheckMedicalRecords();
    
    res.json({
      debug,
      message: 'Check server logs for more details'
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug check failed', message: error.message });
  }
});

export default router; 