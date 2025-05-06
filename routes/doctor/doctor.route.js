import express from 'express';
import patientListRouter from './patientList.route.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import dashboardService from '../../services/doctor-side-service/dashboard.service.js';
import appointmentService from '../../services//doctor-side-service/appointment.service.js';
import medicalRecordService from '../../services/medical-record.service.js';
import doctorMedicalRecordService from '../../services/doctor-side-service/medical-record.service.js';
import moment from 'moment';
import testRequestService from '../../services/doctor-side-service/test-request.service.js';
import medicationService from '../../services/doctor-side-service/medication.service.js';
import prescriptionService from '../../services/doctor-side-service/prescription.service.js';

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
  try {
    // Get the doctorId from the session or use a default for testing
    const doctorId = req.session.authUser?.doctorId || 2;
    
    // Debug incoming date parameter
    const rawDate = req.query.date;
    console.log("Raw date parameter:", rawDate);
    
    // Get date from query params or use today's date
    let selectedDate;
    
    if (rawDate) {
      // Start with the raw date value
      selectedDate = rawDate; 
      
      // If format contains slashes (like 5/5/2025 or 05/05/2025)
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          // Format is likely DD/MM/YYYY
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2]; 
          
          selectedDate = `${year}-${month}-${day}`;
          console.log(`Converted date ${rawDate} to ${selectedDate} (DD/MM/YYYY format)`);
        }
      } else if (rawDate.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        // Format like 5-5-2025 or 05-05-2025 (DD-MM-YYYY)
        const parts = rawDate.split('-');
        selectedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        console.log(`Converted date ${rawDate} to ${selectedDate} (DD-MM-YYYY format)`);
      }
      
      // Make sure the date is valid
      if (!moment(selectedDate, 'YYYY-MM-DD', true).isValid()) {
        console.log(`Date ${selectedDate} is not valid, using today's date instead`);
        selectedDate = moment().format('YYYY-MM-DD');
      }
    } else {
      // No date provided, use today
      selectedDate = moment().format('YYYY-MM-DD');
    }
    
    console.log("Final normalized date for database query:", selectedDate);
    
    // Format the date for display
    const formattedDate = moment(selectedDate).format('dddd, MMMM D, YYYY');
    
    // Get appointments for the selected date
    const appointments = await appointmentService.findByDateRange(selectedDate, selectedDate);
    console.log(`Found ${appointments.length} total appointments for date ${selectedDate}`);
    
    // Filter by doctor
    const doctorAppointments = appointments.filter(app => app.doctorId === doctorId);
    console.log(`Found ${doctorAppointments.length} appointments for doctor ${doctorId} on ${selectedDate}`);
    
    // Debug appointment info
    if (doctorAppointments.length > 0) {
      console.log("Doctor's appointments for this date:");
      doctorAppointments.forEach(app => {
        console.log(`${app.appointmentId}: ${app.patientName} at ${app.estimatedTime || 'unspecified time'}`);
      });
    }
    
    // Format appointments for the template
    const formattedAppointments = doctorAppointments.map((appointment, index) => ({
      ...appointment,
      timeFormatted: appointment.estimatedTime 
        ? moment(appointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') 
        : 'N/A',
      appointmentNumber: index + 1
    }));
    
    // Get the currently selected appointment (if any)
    const selectedAppointmentId = req.query.appointmentId;
    let selectedAppointment = null;
    
    if (selectedAppointmentId) {
      // Fetch detailed info for the selected appointment
      selectedAppointment = await appointmentService.getAppointmentWithServices(selectedAppointmentId);
      
      if (selectedAppointment) {
        // Add formatting to selected appointment
        selectedAppointment = {
          ...selectedAppointment,
          timeFormatted: selectedAppointment.estimatedTime 
            ? moment(selectedAppointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') 
            : 'N/A',
          dateFormatted: moment(selectedAppointment.appointmentDate).format('MMMM D, YYYY'),
          timeRangeFormatted: selectedAppointment.estimatedTime 
            ? `${moment(selectedAppointment.estimatedTime, 'HH:mm:ss').format('hh:mm A')} - ${moment(selectedAppointment.estimatedTime, 'HH:mm:ss').add(30, 'minutes').format('hh:mm A')}`
            : 'Not specified',
          patientGenderFormatted: selectedAppointment.patientGender === 'male' ? 'Male' : 'Female',
          patientAge: selectedAppointment.patientDob 
            ? moment().diff(moment(selectedAppointment.patientDob), 'years') 
            : 'Unknown'
        };
      }
    }
    
    res.locals.active = 'appointments'; 
    res.render('vwDoctor/appointment', {
      selectedDate,
      formattedDate,
      appointments: formattedAppointments,
      hasAppointments: formattedAppointments.length > 0,
      selectedAppointment
    });
  } catch (error) {
    console.error('Error loading appointments:', error);
    res.render('vwDoctor/appointment', { 
      error: 'Could not load appointments',
      formattedDate: moment().format('dddd, MMMM D, YYYY'),
      selectedDate: moment().format('YYYY-MM-DD')
    });
  }
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
    
    // Get success message from session if exists
    const prescriptionSuccess = req.session.prescriptionSuccess || null;
    
    // Clear the success message to prevent showing it again on refresh
    if (req.session.prescriptionSuccess) {
      delete req.session.prescriptionSuccess;
    }
    
    res.render('vwDoctor/patientDetails', { 
      patient: formattedPatient,
      prescriptionSuccess
    });
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

router.get('/test-request', async function (req, res) {
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
          appointmentId: appointmentId
        };
      }
    } 
    // Otherwise use the patient ID to get patient details
    else if (patientId) {
      const patient = await patientDetailsService.getPatientDetails(patientId);
      if (patient) {
        patientDetails = {
          patientId: patient.patientId,
          patientName: patient.fullName,
          patientGender: patient.gender,
          patientDob: patient.dob,
          patientAge: patient.dob 
            ? moment().diff(moment(patient.dob), 'years') 
            : 'Unknown',
          patientGenderFormatted: patient.gender === 'male' ? 'Male' : 'Female'
        };
      }
    }
    
    if (!patientDetails) {
      return res.redirect('/doctor/appointments');
    }
    
    // Pass patient details to the template
    res.render('vwDoctor/testRequestForm', { 
      patient: patientDetails,
      testRequestCode: `TR-${moment().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`
    });
  } catch (error) {
    console.error('Error loading test request form:', error);
    res.redirect('/doctor/appointments');
  }
});

router.get('/prescription-medicine', async function (req, res) {
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
        // Also try to get the current appointment status if available
        let appointmentStatus = 'examining'; // Default status
        
        // Get the most recent appointment for this patient to check status
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

router.get('/messages', async function (req, res) {
  res.locals.active = 'messages'; // Set active menu item

  res.redirect('/doctor/dashboard');
});

router.get('/schedule', async function (req, res) {
  res.locals.active = 'appointments'; 
  res.redirect('/doctor/appointments');
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

// POST endpoint to handle examination form submission
router.post('/examination/submit', async function (req, res) {
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

// Add the test request submission endpoint
router.post('/test-request/submit', async function(req, res) {
  try {
    const { appointmentId, serviceId, testName, status } = req.body;
    
    if (!appointmentId || !serviceId) {
      return res.status(400).send('appointmentId and serviceId are required');
    }
    
    // Get the appointment details to get doctor information
    const appointment = await appointmentService.getAppointmentWithServices(appointmentId);
    
    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }
    
    // Get the doctorId from the session or the appointment
    const doctorId = req.session.authUser?.doctorId || appointment.doctorId;
    
    // Create the test request object
    const testRequest = {
      appointmentId: appointmentId,
      serviceId: serviceId,
      requestDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      status: status || 'pending',
      notes: `Test request for ${testName}`,
      requestedByDoctorId: doctorId
    };
    
    // Add the test request to the database
    const requestId = await testRequestService.add(testRequest);
    
    // Redirect back to examination page with success message
    req.session.testRequestSuccess = `Test request for ${testName} created successfully`;
    res.redirect(`/doctor/examination?appointmentId=${appointmentId}`);
    
  } catch (error) {
    console.error('Error submitting test request:', error);
    res.status(500).send('Failed to create test request: ' + error.message);
  }
});

// POST endpoint to save prescription
router.post('/prescription-save', async function(req, res) {
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
    
    // Redirect back to patient details with success message
    req.session.prescriptionSuccess = 'Prescription saved successfully';
    res.redirect(`/doctor/patient-details?patientId=${patientId}`);
    
  } catch (error) {
    console.error('Error saving prescription:', error);
    res.status(500).send('Failed to save prescription: ' + error.message);
  }
});

// Route for getting prescription history for a patient
router.get('/prescription-history', async function (req, res) {
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

export default router;