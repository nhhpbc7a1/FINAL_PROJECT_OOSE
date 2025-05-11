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
import notificationService from '../../services/notification.service.js';
import doctorNotificationService from '../../services/doctor-side-service/doctorNotification.service.js';

const router = express.Router();

// Middleware to add notifications count to all doctor routes
router.use(async (req, res, next) => {
  try {
    // Get the userId from session or use default for testing
    const userId = req.session.authUser?.userId || 4; // assuming userId for doctorId 2 is 4
    
    // Get unread count
    const unreadCount = await notificationService.countUnreadByUser(userId);
    
    // Add to locals for use in templates
    res.locals.unreadCount = unreadCount;
    
    next();
  } catch (error) {
    console.error('Error getting notification count:', error);
    next();
  }
});

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
    const doctorId = req.session.authUser?.doctorId || ""; // Fallback to ID 1 for testing
    
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

// Route for redirecting to the test request form
router.get('/request-test', function (req, res) {
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
          appointmentId: appointmentId,
          patientAppointmentStatus: appointmentDetails.patientAppointmentStatus || 'examining'
        };
      }
    }
    // Otherwise use the patient ID to get patient details
    else if (patientId) {
      const patient = await patientDetailsService.getPatientDetails(patientId);
      if (patient) {
        let appointmentStatus = 'examining';
        if (patient.appointments && patient.appointments.length > 0) {
          const sortedAppointments = [...patient.appointments].sort((a, b) => {
            return new Date(b.appointmentDate) - new Date(a.appointmentDate);
          });
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
          patientAppointmentStatus: appointmentStatus
        };
      }
    }
    if (!patientDetails) {
      return res.redirect('/doctor/appointments');
    }
    // Lấy danh sách test động
    const testsByCategory = await testRequestService.getAllActiveTestsByCategory();
    // Pass patient details và testsByCategory to the template
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

router.get('/messages', async function (req, res) {
  try {
    // Get the doctorId and userId from the session or use defaults for testing
    const userId = req.session.authUser?.userId || 6;   // sao khi chạy nhớ sửa chỗ này
    console.log(userId)
    // Fetch notifications for this user
    const notifications = await notificationService.findByUser(userId);
    
    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      formattedDate: moment(notification.createdDate).format('MMM D, YYYY'),
      formattedTime: moment(notification.createdDate).format('hh:mm A'),
      timeAgo: moment(notification.createdDate).fromNow()
    }));
    
    // Get unread count
    const unreadCount = await notificationService.countUnreadByUser(userId);
    
    res.locals.active = 'messages'; // Set active menu item
    res.render('vwDoctor/messages', {
      notifications: formattedNotifications,
      hasNotifications: formattedNotifications.length > 0,
      unreadCount
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.render('vwDoctor/messages', { error: 'Could not load notifications' });
  }
});

router.post('/messages/mark-read/:id', async function (req, res) {
  try {
    const notificationId = req.params.id;
    console.log(`Attempting to mark notification ${notificationId} as read`);
    const result = await doctorNotificationService.markAsRead(notificationId);
    console.log(`Mark as read result: ${result}`);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.redirect('/doctor/messages?error=Could not mark notification as read');
  }
});

router.post('/messages/mark-all-read', async function (req, res) {
  try {
    const userId = req.session.authUser?.userId || 6;
    await doctorNotificationService.markAllAsRead(userId);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.redirect('/doctor/messages?error=Could not mark all notifications as read');
  }
});

router.post('/messages/delete/:id', async function (req, res) {
  try {
    const notificationId = req.params.id;
    console.log(`Attempting to delete notification ${notificationId}`);
    const result = await doctorNotificationService.deleteNotification(notificationId);
    console.log(`Delete result: ${result}`);
    res.redirect('/doctor/messages');
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.redirect('/doctor/messages?error=Could not delete notification');
  }
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
    
    // Get appointment details to find the patient
    const appointmentDetails = await appointmentService.findById(appointmentId);
    if (!appointmentDetails) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
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
        // Import the notification utility
        const notificationUtils = (await import('../../ultis/notification.utils.js')).default;
        
        // Send notification
        await notificationUtils.sendNotification(
          patientData.userId,
          'Medical examination completed',
          `Your examination on ${moment(appointmentDetails.appointmentDate).format('MMMM D, YYYY')} has been completed. Please check your medical records.`
        );
        
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

// Add the test request submission endpoint
router.post('/test-request/submit', async function(req, res) {
  try {
    const { appointmentId, serviceId, testName, status } = req.body;
    
    if (!appointmentId || !serviceId) {
      return res.status(400).send('appointmentId and serviceId are required');
    }
    
    // Get the appointment details to get doctor and patient information
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
    
    // Send notifications
    try {
      // Import the notification utility
      const notificationUtils = (await import('../../ultis/notification.utils.js')).default;
      
      // 1. Send notification to the patient
      if (appointment.patientId) {
        const patientData = await patientDetailsService.getPatientBasicInfo(appointment.patientId);
        if (patientData && patientData.userId) {
          await notificationUtils.sendNotification(
            patientData.userId,
            'New lab test requested',
            `Your doctor has requested a ${testName} test. The lab team will process your request shortly.`
          );
        }
      }
      
      // 2. Send notification to lab technicians
      // For simplicity, we're sending to userId 6 which corresponds to a lab technician
      // In a real application, you would query for all lab technicians or specific ones based on the test type
      await notificationUtils.sendNotification(
        6, // Lab technician userId
        'New test request received',
        `Dr. ${appointment.doctorName} has requested a ${testName} test for patient ${appointment.patientName}.`
      );
      
    } catch (notificationError) {
      console.error('Error sending notifications for test request:', notificationError);
      // We don't want to fail the test request submission if notifications fail
    }
    
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

// API route to get patient medical records
router.get('/api/patients/:patientId/medical-records', async function (req, res) {
  try {
    const patientId = req.params.patientId;
    console.log(patientId)
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

// API route to get patient previous visits/appointments
router.get('/api/patients/:patientId/appointments', async function (req, res) {
  try {
    const patientId = req.params.patientId;
    const excludeAppointmentId = req.query.exclude || null;
    
    console.log(`Fetching previous visits for patient: ${patientId}, excluding: ${excludeAppointmentId}`);
    
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Get all appointments for the patient
    console.log('Calling appointmentService.getPatientAppointments with patientId:', patientId);
    const appointments = await appointmentService.getPatientAppointments(patientId);
    console.log(`Retrieved ${appointments ? appointments.length : 0} appointments from service`);
    
    // Instead of filtering out the current appointment, mark it with a flag
    let formattedAppointments = [];
    if (appointments && appointments.length > 0) {
      formattedAppointments = appointments.map(appointment => {
        // Check if this is the current appointment
        const isCurrent = excludeAppointmentId && 
                         appointment.appointmentId.toString() === excludeAppointmentId.toString();
        
        return {
          ...appointment,
          dateFormatted: moment(appointment.appointmentDate).format('MMM D, YYYY'),
          timeFormatted: appointment.estimatedTime 
            ? moment(appointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') 
            : 'N/A',
          doctorName: appointment.doctorName || 'Unknown',
          department: appointment.specialtyName || 'General Medicine',
          notes: appointment.diagnosis || appointment.notes || '',
          status: appointment.patientAppointmentStatus || 'Unknown',
          isCurrent: isCurrent,
          // If it's the current appointment, add a special note
          titleSuffix: isCurrent ? ' (Current Visit)' : ''
        };
      });
      
      // Sort by date, with most recent first
      formattedAppointments.sort((a, b) => {
        return new Date(b.appointmentDate) - new Date(a.appointmentDate);
      });
    }
    
    console.log(`Formatted ${formattedAppointments.length} appointments for response`);
    if (formattedAppointments.length > 0) {
      console.log('First appointment:', {
        id: formattedAppointments[0].appointmentId,
        date: formattedAppointments[0].dateFormatted,
        status: formattedAppointments[0].status,
        isCurrent: formattedAppointments[0].isCurrent
      });
    }
    
    res.json({ 
      appointments: formattedAppointments,
      count: formattedAppointments.length,
      patientId: patientId
    });
  } catch (error) {
    console.error('Error fetching previous visits:', error);
    res.status(500).json({ 
      error: 'Failed to load previous visits',
      message: error.message 
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