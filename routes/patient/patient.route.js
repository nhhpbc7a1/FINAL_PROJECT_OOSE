import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'patient';
    next();
});

router.get('/', async function (req, res) {
    res.render('homepage');
});

import bookAppointmentRouter from './book_appointment.js'
router.use('/book-appointment', bookAppointmentRouter);

import profileRouter  from './profile.route.js'
router.use('/profile', profileRouter);

export default router;