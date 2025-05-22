import express from 'express';
import moment from 'moment';
import db from '../../ultis/db.js';
import Appointment from '../../models/Appointment.js';
import Patient from '../../models/Patient.js';
import MedicalRecord from '../../models/MedicalRecord.js';
import Notification from '../../models/Notification.js';
import Doctor from '../../models/Doctor.js';
import Room from '../../models/Room.js';

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
    console.log(`Examination route accessed with appointmentId: ${appointmentId}`);
    
    if (!appointmentId) {
      console.error('No appointmentId provided');
      req.session.errorMessage = 'No appointment ID provided';
      return res.redirect('/doctor/appointments');
    }
    
    // Validate the appointment exists before continuing
    const appointmentExists = await Appointment.findById(appointmentId);
    if (!appointmentExists) {
      console.error(`Appointment with ID ${appointmentId} not found`);
      req.session.errorMessage = `Appointment with ID ${appointmentId} not found`;
      return res.redirect('/doctor/appointments');
    }
    
    console.log(`Found appointment: ${appointmentExists.appointmentId} for patient: ${appointmentExists.patientName}`);
    
    // First assign a random room to this appointment if needed
    try {
      const updatedAppointment = await Appointment.assignRandomRoom(appointmentId);
      console.log(`Room assignment result for appointment ${appointmentId}: ${updatedAppointment.roomNumber || 'Not assigned'}`);
    } catch (roomError) {
      console.error('Error assigning room:', roomError);
      // Continue even if room assignment fails
    }
    
    // Fetch appointment details with patient information
    const appointmentDetails = await Appointment.findById(appointmentId);
    
    if (!appointmentDetails) {
      return res.redirect('/doctor/appointments');
    }
    
    // Fetch any additional data needed (since we can't use populate)
    let patientData = null;
    let doctorData = null;
    
    try {
      if (appointmentDetails.patientId) {
        patientData = await Patient.findById(appointmentDetails.patientId);
      }
      
      if (appointmentDetails.doctorId) {
        doctorData = await Doctor.findById(appointmentDetails.doctorId);
      }
    } catch (fetchError) {
      console.error('Error fetching related data:', fetchError);
      // Continue even if related data fetch fails
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
      examinationCode: `EX-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientAge: 'Unknown' // Default value that will be overridden below
    };
    
    // Calculate patient age
    if (appointmentDetails.patientDob) {
      try {
        formattedAppointment.patientAge = moment().diff(moment(appointmentDetails.patientDob), 'years');
        console.log(`Examination - Calculated patient age: ${formattedAppointment.patientAge} for DOB: ${appointmentDetails.patientDob}`);
      } catch (ageError) {
        console.error('Error calculating age:', ageError);
        formattedAppointment.patientAge = 'Unknown';
      }
    } else {
      console.log('Warning: patientDob is missing in examination. Attempting to retrieve...');
      // No age info, try to get from patient model
      try {
        // Get the full patient data instead of using select()
        const patientData = await Patient.findById(appointmentDetails.patientId);
        if (patientData && patientData.dob) {
          formattedAppointment.patientAge = moment().diff(moment(patientData.dob), 'years');
          console.log(`Retrieved DOB from patient model: ${patientData.dob}, calculated age: ${formattedAppointment.patientAge}`);
        } else {
          formattedAppointment.patientAge = 'Unknown';
          console.log('Could not find patient DOB information');
        }
      } catch (error) {
        console.error('Error retrieving patient data for age calculation:', error);
        formattedAppointment.patientAge = 'Unknown';
      }
    }
    
    // Ensure room information is available
    if (!formattedAppointment.roomNumber) {
      console.log('Room information missing for appointment. Attempting to retrieve...');
      try {
        // Get room information using Room model
        if (appointmentDetails.roomId) {
          const room = await Room.findById(appointmentDetails.roomId);
          if (room && room.roomNumber) {
            formattedAppointment.roomNumber = room.roomNumber;
            console.log(`Retrieved room number using Room model: ${formattedAppointment.roomNumber}`);
          }
        } else {
          // If no roomId is set, try direct database query as fallback
          console.log('No roomId set, trying direct DB query for room information');
          const roomData = await db('Appointment')
            .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
            .where('Appointment.appointmentId', appointmentId)
            .select('Room.roomNumber')
            .first();
            
          if (roomData && roomData.roomNumber) {
            formattedAppointment.roomNumber = roomData.roomNumber;
            console.log(`Retrieved room number from direct query: ${formattedAppointment.roomNumber}`);
          } else {
            console.log('No room assigned for this appointment');
            formattedAppointment.roomNumber = 'Not assigned';
          }
        }
      } catch (roomError) {
        console.error('Error retrieving room information:', roomError);
      }
    }
    
    // Ensure patient email is available
    if (!formattedAppointment.patientEmail) {
      try {
        // Get full patient data instead of using select
        const patientData = await Patient.findById(appointmentDetails.patientId);
        if (patientData && patientData.email) {
          formattedAppointment.patientEmail = patientData.email;
        }
      } catch (emailError) {
        console.error('Error fetching patient email:', emailError);
        // Don't fail the entire request if email fetch fails
      }
    }
    
    console.log(`Examination for appointment ${appointmentId} - Room: ${appointmentDetails.roomNumber || 'Not assigned'}`);
    
    // Update appointment status to examining if it's currently waiting
    if (appointmentDetails.patientAppointmentStatus === 'waiting') {
      await Appointment.updatePatientAppointmentStatus(appointmentId, 'examining');
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
    const appointmentDetails = await Appointment.findById(appointmentId);
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
    
    // Add medical record to database
    const medicalRecord = new MedicalRecord(recordData);
    const recordId = await medicalRecord.saveOrUpdate();
    console.log(`Created/updated medical record with ID ${recordId}`);
    
    // Update the appointment status to "examined"
    await Appointment.updatePatientAppointmentStatus(appointmentId, 'examined');
    console.log(`Updated appointment ${appointmentId} status to "examined"`);
    
    // Release the room, making it available for other appointments
    try {
      const roomReleased = await Appointment.releaseRoom(appointmentId);
      if (roomReleased) {
        console.log(`Successfully released room for appointment ${appointmentId}`);
      } else {
        console.log(`Could not release room for appointment ${appointmentId} - room may not have been assigned`);
      }
    } catch (roomError) {
      console.error(`Error releasing room for appointment ${appointmentId}:`, roomError);
      // Continue even if room release fails - don't fail the whole examination
    }
    
    // Send notification to the patient
    try {
      // Get full patient data instead of using select and lean
      const patientData = await Patient.findById(appointmentDetails.patientId);
      if (patientData && patientData.userId) {
        // Create and save notification
        const notification = new Notification({
          userId: patientData.userId,
          title: 'Medical examination completed',
          content: `Your examination on ${moment(appointmentDetails.appointmentDate).format('MMMM D, YYYY')} has been completed. Please check your medical records.`,
          isRead: false,
          createdDate: new Date()
        });
        
        const notificationId = await notification.save();
          console.log(`Notification sent to patient (userId: ${patientData.userId})`);
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
    
    // Get medical records for the patient
    const records = await MedicalRecord.findByPatientId(patientId);
    
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
    const debug = await MedicalRecord.debugCheckRecords();
    
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