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

// Redirect từ /admin/manage_doctor sang /admin/manage_doctor/
// 

import manageDoctorRouter from './manage_doctor.route.js'
router.use('/manage_doctor', manageDoctorRouter);

export default router;

