import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'patient';
    next();
});

router.get('/', async function (req, res) {
    res.redirect('/patient/profile');
});

import bookAppointmentRouter from './book_appointment.route.js'
router.use('/book-appointment', bookAppointmentRouter);

import profileRouter  from './profile.route.js'
router.use('/profile', profileRouter);

import specialtyRouter from './specialty.route.js'
router.use('/specialty', specialtyRouter);

// Import các route mới
import specialtiesListRouter from './specialties_list.route.js'
router.use('/specialties', specialtiesListRouter);

import doctorsListRouter from './doctors_list.route.js'
router.use('/doctors', doctorsListRouter);

import servicesListRouter from './services_list.route.js'
router.use('/services', servicesListRouter);

import doctorDetailRouter from './doctor_detail.route.js'
router.use('/doctor', doctorDetailRouter);

// Import schedules route
import schedulesListRouter from './schedules_list.route.js'
router.use('/schedules', schedulesListRouter);

export default router;