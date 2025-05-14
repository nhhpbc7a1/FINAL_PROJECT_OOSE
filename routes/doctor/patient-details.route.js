import express from 'express';
import moment from 'moment';
import patientDetailsService from '../../services/doctor-side-service/patientDetails.service.js';

const router = express.Router();

// Middleware for layout
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
});

router.get('/', async function (req, res) {
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

export default router; 