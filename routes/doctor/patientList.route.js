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

    const patients = await patientListService.findAll();

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
      
      // Set default current status
      let currentStatus = patient.appointmentStatus || 'no-appointments';
      
      return {
        ...patient,
        age,
        lastVisitFormatted,
        currentStatus
      };
    });
    
    console.log("First patient with processed data:", patientsWithAge[0]);

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