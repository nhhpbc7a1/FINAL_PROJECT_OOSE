import express from 'express';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'bookAppointment';
    next();
  });

router.get('/', async function (req, res) {
    res.redirect('/patient/book-appointment/input-form');
});
  

router.get('/input-form', async function (req, res) {
    res.render('vwPatient/bookAppointment/inputForm');
});
  
  // router.get('/verify-email', async function (req, res) {
  //   res.render('vwPatient/bookAppointment/verifyEmail');
  // });
  
  
  router.get('/make-payment', async function (req, res) {
    res.render('vwPatient/bookAppointment/makePayment');
  });
  
  
  router.get('/view-appointment', async function (req, res) {
    res.render('vwPatient/bookAppointment/viewAppointment');
  });
  
  
  
  
  export default router;