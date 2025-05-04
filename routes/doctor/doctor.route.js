import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'doctor';
    next();
  });

router.get('/',async function (req, res){
    res.redirect('/doctor/dashboard');
});

router.get('/dashboard', async function (req, res) {
  res.locals.active = 'dashboard'; // Set active menu item
  res.render('vwDoctor/dashboard');  
});

router.get('/appointments', async function (req, res) {
  res.locals.active = 'appointments'; 
  res.render('vwDoctor/appointment');
});

router.get('/patients', async function (req, res) {
  res.locals.active = 'patients'; // Set active menu item
  res.render('vwDoctor/patient');
});

router.get('/patient-details', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';

  res.render('vwDoctor/patientDetails', { patientId });
});

router.get('/examination', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';
  
  // In a real application, you would fetch patient data from database using this ID
  // and pass it to the template
  
  // Pass patientId to the template
  res.render('vwDoctor/examination', { patientId });
});

router.get('/test-request', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';
  
  // In a real application, you would fetch patient data from database using this ID
  // and pass it to the template
  
  // Pass patientId to the template
  res.render('vwDoctor/testRequestForm', { patientId });
});

router.get('/prescription-medicine', async function (req, res) {
  // Get patient ID from query parameters
  const patientId = req.query.patientId || '';
  
  // In a real application, you would fetch patient data from database using this ID
  // and pass it to the template
  
  // Pass patientId to the template
  res.render('vwDoctor/prescriptionMedicine', { patientId });
});

router.get('/messages', async function (req, res) {
  res.locals.active = 'messages'; // Set active menu item

  res.redirect('/doctor/dashboard');
});

router.get('/schedule', async function (req, res) {
  res.locals.active = 'appointments'; // Use same active as appointments
  // If you don't have a schedule.hbs file yet, you can temporarily redirect to appointments
  res.redirect('/doctor/appointments');
});

export default router;