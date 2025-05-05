import express from 'express';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'profile';
    next();
});
router.get('/', async function (req, res) {
    res.render('vwPatient/individualPage/personalInfo');
});

router.get('/changePass', async function (req, res) {
    res.render('vwPatient/individualPage/changePass');
});


router.get('/appointmentList', async function (req, res) {
    res.render('vwPatient/individualPage/appointmentList');
});

router.get('/appointmentDetail', async function (req, res) {
    res.render('vwPatient/individualPage/appointmentDetail');
});

router.get('/medicalExam', async function (req, res) {
    res.render('vwPatient/individualPage/medicalExam');
});
router.get('/prescription', async function (req, res) {
    res.render('vwPatient/individualPage/prescription');
});
router.get('/bloodTest', async function (req, res) {
    res.render('vwPatient/individualPage/bloodTest');
});

export default router;