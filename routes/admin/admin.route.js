import express from 'express';

const router = express.Router();


router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'dashboard'; // Default route
    // Handle flash messages
    if (req.session.flashMessage) {
        res.locals.flashMessage = req.session.flashMessage;
        delete req.session.flashMessage; // Clear after displaying
    }
    next();
});

router.get('/',async function (_, res){
    res.locals.currentRoute = 'dashboard';
    res.redirect('/admin/dashboard');
});

// Các route khác của admin sẽ được thêm vào đây

import manageSpecialtyRouter from './manage_specialty.route.js'
router.use('/manage_specialty', manageSpecialtyRouter);

import manageDoctorRouter from './manage_doctor.route.js'
router.use('/manage_doctor', manageDoctorRouter);

import manageLabtechRouter from './manage_labtech.route.js'
router.use('/manage_labtech', manageLabtechRouter);

import manageMedicationRouter from './manage_medication.route.js'
router.use('/manage_medication', manageMedicationRouter);

import manageServiceRouter from './manage_service.route.js'
router.use('/manage_service', manageServiceRouter);

import manageRoomRouter from './manage_room.route.js'
router.use('/manage_room', manageRoomRouter);

export default router;

