import express from 'express';
import patientListService from '../../services/doctor-side-service/patientList.service.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    res.locals.currentRoute = 'patientList'; // Set current route highlight
    next();
});

// GET: Display list of patients
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Get the doctorId from the session or use a default for testing
    const doctorId = req.session.authUser?.doctorId || 2; // Fallback to ID 2 for testing
    
    // Pass doctorId to service to get only this doctor's patients
    const patients = await patientListService.findAll(doctorId);

    // Calculate age for each patient and format dates
    const patientsWithAge = patients.map(patient => {
      // Calculate age
      const dob = new Date(patient.dob);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      
      // Format the last visit date if available
      let lastVisitFormatted = 'Not visited yet';
      if (patient.lastVisitDate) {
        const lastVisit = new Date(patient.lastVisitDate);
        const today = new Date();
        const isToday = lastVisit.toDateString() === today.toDateString();
        
        if (isToday) {
          lastVisitFormatted = `Today, ${lastVisit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          lastVisitFormatted = lastVisit.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      // Get appointment status from database or set default
      let appointmentStatus = patient.appointmentStatus || 'no-appointments';
      
      return {
        ...patient,
        age,
        lastVisitFormatted,
        appointmentStatus
      };
    });
    
    console.log(`Processed ${patientsWithAge.length} patients for doctor ID ${doctorId}`);

    res.render('vwDoctor/patient', {
      patients: patientsWithAge,
      totalPatients: patients.length
    });
  } catch (error) {
    console.error('Error loading patients:', error);
    res.render('vwDoctor/patient', { error: 'Failed to load patients' });
  }
});

export default router;