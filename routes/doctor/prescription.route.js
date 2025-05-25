import express from 'express';
import moment from 'moment';
import Doctor from '../../models/Doctor.js';
import Patient from '../../models/Patient.js';
import Appointment from '../../models/Appointment.js';
import Prescription from '../../models/Prescription.js';
import Medication from '../../models/Medication.js';
import MedicalRecord from '../../models/MedicalRecord.js';
import Notification from '../../models/Notification.js';
import db from '../../ultis/db.js';
import PrescriptionDAO from '../../dao/PrescriptionDAO.js';

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
          const latestAppointment = await Appointment.findLatestForPatient(req.query.patientId);
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
    const doctorId = req.session.authUser?.doctorId;
    
    // If not authenticated, redirect to login
    if (!doctorId) {
      return res.redirect('/account/login');
    }
    
    // Get doctor details without using populate
    const doctorProfile = await Doctor.findById(doctorId);
    const specialty = doctorProfile?.specialtyId ? 
      await db('Specialty').where('specialtyId', doctorProfile.specialtyId).first() : null;
    
    // Pass data to the template
    res.render('vwDoctor/prescriptionMedicine', { 
      patient: patientDetails,
      prescriptionCode: `RX-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      currentDate: new Date(),
      doctorSpecialty: specialty?.name || 'General Medicine',
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
      const latestAppointment = await Appointment.findLatestForPatient(patientId);
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
    try {
      const medicalRecord = await MedicalRecord.findByAppointmentId(finalAppointmentId);
      
      if (medicalRecord) {
        // Use existing medical record
        recordId = medicalRecord.recordId;
        console.log('Using existing medical record:', recordId);
      } else {
        // Create a new medical record
        const newRecord = new MedicalRecord({
          appointmentId: finalAppointmentId,
          diagnosis,
          notes: 'Created from prescription module', 
          recommendations: additionalInstructions || '',
          followupDate: null // Optional: could be added to the form if needed
        });
        recordId = await newRecord.save(); // save() returns the ID directly
        console.log('Created new medical record:', recordId);
      }
    } catch (error) {
      console.error('Error finding/creating medical record:', error);
      return res.status(500).send('Failed to create medical record: ' + error.message);
    }
    
    // Create the prescription
    try {
      const prescription = new Prescription({
        recordId: recordId,
        doctorId: doctorId,
        notes: additionalInstructions || '',
      });
      const prescriptionId = await prescription.save();
      console.log('Created prescription:', prescriptionId);
      
      // Now add medication details to the prescription
      if (medicationsArray && medicationsArray.length > 0) {
        // Format medications for prescription details
        const prescriptionDetails = medicationsArray.map(med => ({
          prescriptionId: prescriptionId,
          medicationId: med.medicationId,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          duration: med.duration ? `${med.duration} days` : null,
          instructions: med.instructions || null
        }));
        
        // Add the details
        await PrescriptionDAO.addDetails(prescriptionId, prescriptionDetails);
        console.log(`Added ${prescriptionDetails.length} medications to prescription ${prescriptionId}`);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      return res.status(500).send('Failed to save prescription: ' + error.message);
    }
    
    // Get the doctor and patient information for notification
    try {
      // Get doctor details
      const doctorData = await Doctor.findById(doctorId);
      const specialty = doctorData?.specialtyId ? 
        await db('Specialty').where('specialtyId', doctorData.specialtyId).first() : null;
      
      // Get patient details
      const patientData = await Patient.findById(patientId);
      
      if (patientData && patientData.userId) {
        // Create a notification
        const notification = new Notification({
          userId: patientData.userId,
          title: 'New prescription available',
          content: `Dr. ${doctorData?.fullName || 'your doctor'} has prescribed medication for you. Please check your prescriptions.`,
          isRead: false,
          createdDate: new Date().toISOString() // Format date as ISO string for MySQL
        });
        
        await notification.save();
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
    const prescriptions = await Prescription.findByPatientId(patientId);
    
    // The medications are already included in the prescription model
    
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
      medications = await Medication.searchByName(searchTerm);
    } else if (category) {
      medications = await Medication.findByCategory(category);
    } else {
      medications = await Medication.findAll();
    }
    
    res.json({ success: true, medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch medications' });
  }
});

router.post('/:prescriptionId/update-status', async function(req, res) {
  try {
    const prescriptionId = req.params.prescriptionId;
    const { status } = req.body;
    
    // Check if the doctor is authenticated
    const doctorId = req.session.authUser?.doctorId;
    
    // If not authenticated, redirect to login
    if (!doctorId) {
      return res.redirect('/account/login');
    }
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

export default router; 