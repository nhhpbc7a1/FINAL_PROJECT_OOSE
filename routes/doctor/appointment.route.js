import express from 'express';
import moment from 'moment';
import db from '../../ultis/db.js';
import Appointment from '../../models/Appointment.js';
import Patient from '../../models/Patient.js';
import MedicalRecord from '../../models/MedicalRecord.js';
import Doctor from '../../models/Doctor.js';
import Room from '../../models/Room.js';
import Schedule from '../../models/Schedule.js';
import DoctorAppointment from '../../models/DoctorAppointment.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.active = 'appointments'; 
    next();
});

router.get('/', async function (req, res) {
  try {
    // Get the doctorId from the session
    const doctorId = req.session.authUser?.doctorId;
    
    // Check if doctor is logged in
    if (!doctorId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }
    
    // Check for error message in session
    const errorMessage = req.session.errorMessage || null;
    if (req.session.errorMessage) {
      delete req.session.errorMessage; // Clear the error message
    }
    
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
    // Usando o método do modelo DoctorAppointment
    const appointments = await DoctorAppointment.findByDateRange(selectedDate, selectedDate);
    console.log(`Found ${appointments.length} total appointments for date ${selectedDate}`);
    
    // Filter by doctor
    const doctorAppointments = appointments.filter(app => {
      // Ensure we're comparing the same types (convert both to strings)
      const appDoctorId = app.doctorId?.toString();
      const currentDoctorId = doctorId?.toString();
      console.log(`Comparing appointment doctor ID: ${appDoctorId} with current doctor ID: ${currentDoctorId}`);
      return appDoctorId === currentDoctorId;
    });
    console.log(`Found ${doctorAppointments.length} appointments for doctor ${doctorId} on ${selectedDate}`);
    
    // Debug appointment info
    if (doctorAppointments.length > 0) {
      console.log("Doctor's appointments for this date:");
      doctorAppointments.forEach(app => {
        console.log(`${app.appointmentId}: ${app.patientName} at ${app.estimatedTime || 'unspecified time'}`);
      });
    }
    
    // Format appointments for the template
    const formattedAppointments = doctorAppointments.map((appointment, index) => {
      // Calculate age from DOB
      let patientAge = 'Unknown';
      if (appointment.patientDob) {
        try {
          patientAge = moment().diff(moment(appointment.patientDob), 'years');
          console.log(`Calculated age for patient ${appointment.patientName}: ${patientAge} years old (DOB: ${appointment.patientDob})`);
        } catch (ageError) {
          console.error(`Error calculating age for ${appointment.patientName}:`, ageError);
        }
      } else {
        console.log(`Missing DOB for patient ${appointment.patientName}`);
      }
      
      // Debug room information
      console.log(`Appointment ${appointment.appointmentId} room info: roomId=${appointment.roomId}, roomNumber=${appointment.roomNumber || 'Not assigned'}`);
      
      return {
        ...appointment,
        timeFormatted: appointment.estimatedTime 
          ? moment(appointment.estimatedTime, 'HH:mm:ss').format('hh:mm A') 
          : 'N/A',
        appointmentNumber: index + 1,
        patientAge: patientAge,
        // Ensure roomNumber is properly set
        roomNumber: appointment.roomNumber || 'Not assigned'
      };
    });
    
    // Get the currently selected appointment (if any)
    const selectedAppointmentId = req.query.appointmentId;
    let selectedAppointment = null;
    
    if (selectedAppointmentId) {
      // Fetch detailed info for the selected appointment
      selectedAppointment = await DoctorAppointment.findById(selectedAppointmentId);
      
      if (selectedAppointment) {
        // Ensure patient DOB is available
        if (!selectedAppointment.patientDob) {
          console.log('Warning: patientDob is missing for selected appointment');
          
          // Try to get patient dob from Patient table if needed
          try {
            const patientData = await db('Patient').where('patientId', selectedAppointment.patientId).first('dob');
            if (patientData && patientData.dob) {
              selectedAppointment.patientDob = patientData.dob;
              console.log(`Retrieved patient DOB from Patient table: ${selectedAppointment.patientDob}`);
            }
          } catch (dobError) {
            console.error('Error retrieving patient DOB:', dobError);
          }
        }
        
        // Check if room information is missing
        if (!selectedAppointment.roomNumber) {
          console.log('Warning: Room number is missing for appointment, trying to fetch it directly');
          try {
            // Try to get room information directly from Appointment and Room tables
            const roomData = await db('Appointment')
              .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
              .where('Appointment.appointmentId', selectedAppointment.appointmentId)
              .select('Room.roomNumber')
              .first();
              
            if (roomData && roomData.roomNumber) {
              selectedAppointment.roomNumber = roomData.roomNumber;
              console.log(`Retrieved room number directly: ${selectedAppointment.roomNumber}`);
            } else {
              console.log('Room not assigned for this appointment');
            }
          } catch (roomError) {
            console.error('Error retrieving room information:', roomError);
          }
        }
        
        // Calculate age explicitly
        let patientAge = 'Unknown';
        if (selectedAppointment.patientDob) {
          patientAge = moment().diff(moment(selectedAppointment.patientDob), 'years');
          console.log(`Selected appointment - Calculated age: ${patientAge} years (DOB: ${selectedAppointment.patientDob})`);
        }
        
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
          patientAge: patientAge,
          roomNumber: selectedAppointment.roomNumber || 'Not assigned'
        };
        
        // Ensure patient age is properly set
        if (!selectedAppointment.patientAge || selectedAppointment.patientAge === 'Unknown') {
          // Try to calculate age from patientDob again
          if (selectedAppointment.patientDob) {
            selectedAppointment.patientAge = moment().diff(moment(selectedAppointment.patientDob), 'years');
          }
        }
        
        // Make sure room information is available
        if (!selectedAppointment.roomNumber) {
          console.log('Room number is missing for appointment:', selectedAppointmentId);
        }
      }
    }
    
    res.render('vwDoctor/appointment', {
      selectedDate,
      formattedDate,
      appointments: formattedAppointments,
      hasAppointments: formattedAppointments.length > 0,
      selectedAppointment,
      errorMessage
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
    const patientDetails = await Patient.findById(patientId);
    
    if (!patientDetails) {
      return res.redirect('/doctor/patients');
    }
    
    // Format the patient object for display
    const patient = {
      patientId: patientDetails._id,
      fullName: patientDetails.fullName,
      age: moment().diff(moment(patientDetails.dob), 'years'),
      gender: patientDetails.gender,
      patientCode: `P-${patientId.toString().padStart(8, '0')}`
    };
    
    // Format appointments for display with additional year property for filtering
    // Usando o método do modelo DoctorAppointment
    const appointments = await DoctorAppointment.getPatientAppointments(patientId);
    
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

    // Get all appointments for the patient usando o modelo DoctorAppointment
    console.log('Finding appointments for patient ID:', patientId);
    const appointments = await DoctorAppointment.findByPatient(patientId);
    console.log(`Retrieved ${appointments ? appointments.length : 0} appointments`);
    
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
    
    // Usando o método do modelo DoctorAppointment
    await DoctorAppointment.updatePatientAppointmentStatusWithTransition(appointmentId, status);
    
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