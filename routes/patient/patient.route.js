import express from 'express';
import homepageService from '../../services/patient/homepage.service.js';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'patient';
    next();
});

router.get('/', async function (req, res) {
    try {
        // Get all required data
        const services = await homepageService.getServices();
        const specialties = await homepageService.getSpecialties();
        const doctors = await homepageService.getDoctors();

        res.render('homepage', {
            services,
            specialties,
            doctors
        });
    } catch (error) {
        console.error('Homepage error:', error);
        res.render('homepage', {
            services: [],
            specialties: [],
            doctors: []
        });
    }
});

import bookAppointmentRouter from './book_appointment.js'
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

export default router;