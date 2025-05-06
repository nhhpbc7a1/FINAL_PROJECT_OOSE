import express from 'express';
import patientService from '../../services/patient.service.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'patients'; // Set current route highlight
    next();
});

// GET: Display list of patients
router.get('/', async function (req, res) {
  try {
    // No flash messages for redirects in this pattern
    // const flashMessage = req.session.flashMessage;
    // if (flashMessage) { res.locals.flashMessage = flashMessage; delete req.session.flashMessage; }

    const searchQuery = req.query.search || '';
    let patients;
    if (searchQuery) {
        patients = await patientService.search(searchQuery);
    } else {
        patients = await patientService.findAll();
    }

    // Map data for display (initials, image URL)
    patients = patients.map(patient => ({
      ...patient,
      // Use user's gender/dob if patient's are null (though schema suggests they are required)
      gender: patient.userGender,
      dob: patient.userDob,
      initials: patient.fullName ? patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
      profilePictureUrl: patient.profileImage || '/public/images/default-avatar.png' // Example default
    }));


    res.render('vwAdmin/manage_patient/patient_list', {
      patients,
      totalPatients: patients.length, // Total for initial count display
      searchQuery // Pass search query back to view if needed
    });
  } catch (error) {
    console.error('Error loading patients:', error);
    // Render list view with error message
    res.render('vwAdmin/manage_patient/patient_list', { error: 'Failed to load patients' });
  }
});

// GET: Display details for a single patient
router.get('/view/:patientId', async function (req, res) {
    try {
        res.locals.pageTitle = 'View Patient Details';
        const patientId = parseInt(req.params.patientId, 10);

        if (isNaN(patientId)) {
            // No flash message, just redirect or render error
            return res.redirect('/admin/manage_patient'); // Or render a specific error page
        }

        const patient = await patientService.findById(patientId);

        if (!patient) {
            // No flash message, redirect
            return res.redirect('/admin/manage_patient'); // Patient not found, go back to list
        }

        // Map data for display (initials, image URL, format dates)
        const patientData = {
             ...patient,
             // Use user's gender/dob
             gender: patient.userGender,
             dob: patient.userDob,
             initials: patient.fullName ? patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
             profilePictureUrl: patient.profileImage || '/public/images/default-avatar.png',
             // Format dates using helpers in the template
             // dob: patient.userDob, // Keep original for helper
             // createdDate: patient.createdDate // Keep original for helper
        };


        res.render('vwAdmin/manage_patient/view_patient', {
            patient: patientData
        });

    } catch (error) {
        console.error(`Error loading patient view for ID ${req.params.patientId}:`, error);
         // Redirect to list with a generic error display (assuming list handles `error` variable)
        res.render('vwAdmin/manage_patient/patient_list', { error: 'Failed to load patient details.' });
    }
});


// No POST/DELETE routes required for add/edit/delete

export default router;