import express from 'express';
import moment from 'moment';
import appointmentService from '../../services/doctor-side-service/appointment.service.js';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';
import doctorMedicalRecordService from '../../services/doctor-side-service/medical-record.service.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.active = 'appointments'; 
    next();
});

router.get('/', async function (req, res) {
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

router.get('/schedule', async function (req, res) {
  res.redirect('/doctor/appointments');
});

router.get('/detail', async function (req, res) {
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

// API route to get patient previous visits/appointments
router.get('/api/patients/:patientId', async function (req, res) {
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

// API route to update patient appointment status
router.post('/api/update-status', async function (req, res) {
  try {
    const { appointmentId, status } = req.body;
    
    if (!appointmentId || !status) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters: appointmentId, status' 
      });
    }
    
    // Validate status
    const validStatuses = ['waiting', 'examining', 'examined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid status: ${status}. Valid values are: ${validStatuses.join(', ')}` 
      });
    }
    
    // Update with transition validation
    await appointmentService.updatePatientAppointmentStatusWithTransition(appointmentId, status);
    
    res.json({ 
      success: true,
      message: `Appointment status updated to ${status}`,
      appointmentId,
      status
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update appointment status' 
    });
  }
});

export default router; 