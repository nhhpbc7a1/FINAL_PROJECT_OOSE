import express from 'express';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import moment from 'moment';
import bcrypt from 'bcryptjs';
const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'profile';
    next();
});
router.get('/', async function (req, res) {
    try {
        const userId = req.session.authUser?.userId; // lấy userId từ session
        const user = await User.findById(userId); // sử dụng model User để lấy thông tin

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('vwPatient/individualPage/personalInfo', { layout: 'profile', user });
    }
    catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/personalInfo', async (req, res) => {
    try {
        const userId = req.session.authUser.userId;
        const { fullname, phone, birthday, email, gender, address } = req.body;
        const ymd_dob = moment(birthday,'DD/MM/YYYY').format('YYYY-MM-DD');

        // Lấy user hiện tại
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Cập nhật thông tin
        user.fullName = fullname;
        user.phoneNumber = phone;
        user.dob = ymd_dob;
        user.email = email;
        user.gender = gender;
        user.address = address;

        // Lưu thông tin
        await user.save();

        // Cập nhật thông tin bệnh nhân nếu có
        const patient = await Patient.findByUserId(userId);
        if (patient) {
            patient.dob = ymd_dob;
            patient.gender = gender;
            await patient.save();
        }

        // Cập nhật lại session
        req.session.authUser = {
            ...req.session.authUser,
            fullName: fullname,
            phoneNumber: phone,
            dob: ymd_dob,
            email: email,
            gender,
            address
        };

        res.render('vwPatient/individualPage/personalInfo', {
            user: req.session.authUser,
            updateSuccess: true
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.render('vwPatient/individualPage/personalInfo', {
            user: req.session.authUser,
            updateError: true
        });
    }
});

router.get('/changePass', async function (req, res) {
    res.render('vwPatient/individualPage/changePass');
});
router.post('/changePass', async (req, res) => {
    try {
        const userId = req.session.authUser.userId;
        const newPassword = req.body.new_password;

        // Lấy user hiện tại
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Cập nhật mật khẩu
        user.password = newPassword; // model sẽ tự mã hóa khi lưu
        await user.save();

        return res.render('vwPatient/individualPage/changePass', {
            success: 'Changed password successfully'
        });
    } catch (err) {
        console.error('Change password error:', err);
        return res.render('vwPatient/individualPage/changePass', {
            error: 'Error. Please try again'
        });
    }
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