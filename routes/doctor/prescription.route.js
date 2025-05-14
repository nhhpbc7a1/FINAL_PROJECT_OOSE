import express from 'express';
import moment from 'moment';
import dashboardService from '../../services/doctor-side-service/dashboard.service.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import appointmentService from '../../services/doctor-side-service/appointment.service.js';
import prescriptionService from '../../services/doctor-side-service/prescription.service.js';
import medicationService from '../../services/doctor-side-service/medication.service.js';
import doctorMedicalRecordService from '../../services/doctor-side-service/medical-record.service.js';

const router = express.Router();

// Middleware for layout
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
});

router.get('/medicine', async function (req, res) {
  try {
    // Get patient data from query parameters
    const patientId = req.query.patientId || '';
    const appointmentId = req.query.appointmentId || '';
    const prescriptionId = req.query.prescriptionId || '';
    
    // Handle directly passed patient data from the form
    let patientDetails = null;
    
    if (req.query.patientName) {
      patientDetails = {
        patientId: req.query.patientId,
        patientName: req.query.patientName,
        patientGender: req.query.patientGender,
        patientDob: req.query.patientDob,
        patientAge: req.query.patientAge,
        patientBloodType: req.query.patientBloodType,
        patientAppointmentStatus: 'examining' // Default status for prescription creation
      };
      
      // If no appointment ID is provided, try to get the latest appointment for this patient
      if (!appointmentId) {
        try {
          const latestAppointment = await appointmentService.getLatestAppointmentForPatient(req.query.patientId);
          if (latestAppointment) {
            appointmentId = latestAppointment.appointmentId;
            patientDetails.appointmentId = appointmentId;
          }
        } catch (err) {
          console.error('Error getting latest appointment:', err);
        }
      } else {
        patientDetails.appointmentId = appointmentId;
      }
    }
    // If we have a prescription ID, get patient details from the prescription
    else if (prescriptionId) {
      // Code to fetch prescription details would go here
      // const prescriptionDetails = await prescriptionService.getById(prescriptionId);
    }
    // If we have an appointment ID, get patient details from the appointment
    else if (appointmentId) {
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
        // Get the most recent appointment for this patient to check status
        let appointmentStatus = 'examining'; // Default status
        
        // If we have appointments in the patient details, get the latest status
        if (patient.appointments && patient.appointments.length > 0) {
          // Sort appointments by date, descending
          const sortedAppointments = [...patient.appointments].sort((a, b) => {
            return new Date(b.appointmentDate) - new Date(a.appointmentDate);
          });
          
          // Use the status from the most recent appointment
          appointmentStatus = sortedAppointments[0].patientAppointmentStatus || 'examining';
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
          patientBloodType: patient.bloodType,
          patientAppointmentStatus: appointmentStatus
        };
      }
    }
    
    if (!patientDetails) {
      return res.redirect('/doctor/patients');
    }
    
    // Get the doctor's information from the session
    const doctorId = req.session.authUser?.doctorId || 1; // Fallback to ID 1 for testing
    const doctorProfile = await dashboardService.getDoctorProfile(doctorId);
    
    // Pass data to the template
    res.render('vwDoctor/prescriptionMedicine', { 
      patient: patientDetails,
      prescriptionCode: `RX-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      currentDate: new Date(),
      doctorSpecialty: doctorProfile?.specialtyName || 'General Medicine',
      doctorName: doctorProfile?.fullName || 'Doctor',
      doctorId: doctorId // Pass doctorId to the template
    });
  } catch (error) {
    console.error('Error loading prescription form:', error);
    res.redirect('/doctor/patients');
  }
});

// POST endpoint to save prescription
router.post('/save', async function(req, res) {
  try {
    const { patientId, appointmentId, doctorId, diagnosis, additionalInstructions, medications } = req.body;
    
    console.log('Prescription save request received:', {
      patientId,
      appointmentId, 
      doctorId,
      diagnosis: diagnosis ? 'Present' : 'Missing',
      additionalInstructions: additionalInstructions ? 'Present' : 'Missing',
      medications: medications ? 'Present' : 'Missing'
    });
    
    // Validate required fields
    if (!patientId || !doctorId || !diagnosis) {
      console.error('Missing required fields:', { patientId, doctorId, diagnosis });
      return res.status(400).send('Missing required fields: patientId, doctorId, and diagnosis are required');
    }
    
    // Parse medications from JSON string
    let medicationsArray = [];
    try {
      medicationsArray = JSON.parse(medications);
    } catch (e) {
      console.error('Error parsing medications JSON:', e);
      return res.status(400).send('Invalid medications data');
    }
    
    if (!Array.isArray(medicationsArray) || medicationsArray.length === 0) {
      console.error('No medications provided or invalid medications array');
      return res.status(400).send('No medications provided');
    }
    
    // Find a valid appointment for this patient if not provided
    let finalAppointmentId = appointmentId;
    if (!finalAppointmentId) {
      const latestAppointment = await appointmentService.getLatestAppointmentForPatient(patientId);
      if (latestAppointment) {
        finalAppointmentId = latestAppointment.appointmentId;
        console.log('Using latest appointment ID:', finalAppointmentId);
      } else {
        console.error('No appointment found for patient', patientId);
        return res.status(400).send('No appointment found for patient');
      }
    }
    
    // Check if we need to create a medical record first
    let recordId;
    const medicalRecord = await doctorMedicalRecordService.findByAppointmentId(finalAppointmentId);
    
    if (medicalRecord) {
      // Use existing medical record
      recordId = medicalRecord.recordId;
      console.log('Using existing medical record:', recordId);
    } else {
      // Create a new medical record
      recordId = await doctorMedicalRecordService.createExaminationRecord({
        appointmentId: finalAppointmentId,
        diagnosis,
        notes: 'Created from prescription module', 
        recommendations: additionalInstructions || '',
        followupDate: null // Optional: could be added to the form if needed
      });
      console.log('Created new medical record:', recordId);
    }
    
    // Create the prescription
    const prescriptionId = await prescriptionService.add({
      recordId,
      doctorId,
      notes: additionalInstructions || ''
    });
    console.log('Created prescription:', prescriptionId);
    
    // Add prescription medications
    await prescriptionService.addPrescriptionDetails(prescriptionId, medicationsArray);
    console.log('Added prescription medications');
    
    // Get the doctor and patient information for notification
    try {
      const [doctorData, patientData] = await Promise.all([
        dashboardService.getDoctorProfile(doctorId),
        patientDetailsService.getPatientBasicInfo(patientId)
      ]);
      
      if (patientData && patientData.userId) {
        // Import the notification utility
        const notificationUtils = (await import('../../ultis/notification.utils.js')).default;
        
        // Generate a summary of medications for the notification
        const medSummary = medicationsArray.length === 1 
          ? medicationsArray[0].name
          : `${medicationsArray.length} medications`;
        
        // Send notification to patient
        await notificationUtils.sendNotification(
          patientData.userId,
          'New prescription available',
          `Dr. ${doctorData?.fullName || 'your doctor'} has prescribed ${medSummary} for you. Please check your prescriptions.`
        );
        
        console.log(`Notification sent to patient (userId: ${patientData.userId})`);
      }
    } catch (notificationError) {
      console.error('Error sending prescription notification:', notificationError);
      // Continue with the save process even if notification fails
    }
    
    // Redirect back to patient details with success message
    req.session.prescriptionSuccess = 'Prescription saved successfully';
    res.redirect(`/doctor/patient-details?patientId=${patientId}`);
    
  } catch (error) {
    console.error('Error saving prescription:', error);
    res.status(500).send('Failed to save prescription: ' + error.message);
  }
});

// Route for getting prescription history for a patient
router.get('/history', async function (req, res) {
  try {
    const patientId = req.query.patientId || '';
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Fetch prescriptions for the patient
    const prescriptions = await prescriptionService.getByPatientId(patientId);
    
    // Get medication details for each prescription
    for (const prescription of prescriptions) {
      // Get the details for this prescription
      const prescriptionDetails = await prescriptionService.getById(prescription.prescriptionId);
      
      // Add medication details to the prescription
      prescription.medicationDetails = prescriptionDetails ? prescriptionDetails.medications : [];
    }
    
    // Return prescription data as JSON
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescription history:', error);
    res.status(500).json({ error: 'Failed to fetch prescription history' });
  }
});

// API endpoint to get medications
router.get('/api/medications', async function (req, res) {
  try {
    const searchTerm = req.query.search;
    const category = req.query.category;
    
    let medications;
    
    if (searchTerm) {
      medications = await medicationService.searchByName(searchTerm);
    } else if (category) {
      medications = await medicationService.findByCategory(category);
    } else {
      medications = await medicationService.findAll();
    }
    
    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch medications' });
  }
});

export default router; 