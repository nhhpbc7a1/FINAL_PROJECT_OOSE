import express from 'express';
import userService from '../../services/user.service.js';
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
        const user = await userService.findById(userId); // gọi service để lấy thông tin user

        res.render('vwPatient/individualPage/personalInfo', { layout: 'profile', user });
    }
    catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/personalInfo', async (req, res) => {
    const userId = req.session.authUser.userId;

    const { fullname, phone, birthday, email, gender, address } = req.body;
    const ymd_dob = moment(birthday,'DD/MM/YYYY').format('YYYY-MM-DD');

    const updatedUser = {
        fullName: fullname,
        phoneNumber: phone,
        dob: ymd_dob,
        email: email,
        gender,
        address
        };
        try {
        const success = await userService.update(userId, updatedUser);

        if (success) {
            // Cập nhật lại session
            req.session.authUser = {
            ...req.session.authUser,
            ...updatedUser
            };

            res.render('vwPatient/individualPage/personalInfo', {
            user: req.session.authUser,
            updateSuccess: true
            });
        } else {
            res.render('vwPatient/individualPage/personalInfo', {
            user: req.session.authUser,
            updateError: true
            });
        }
        } catch (error) {
        console.error('Error updating profile:', error);
        res.render('vwPatient/individualPage/personalInfo', {
            user: req.session.authUser,
            updateError: true
        });
    }
});

//     try {

//         // Cập nhật thông tin vào DB (ví dụ dùng SQL hoặc MongoDB)
//         const ymd_dob = moment(birthday,'DD/MM/YYYY').format('YYYY-MM-DD');
        
//         await UserModel.updateOne(
//             { _id: userId },
//             {
//                 fullName: fullname,
//                 phoneNumber: phone,
//                 dob: ymd_dob,
//                 email: email,
//                 gender,
//                 address
//             }
//         );

//         // Redirect hoặc render lại với thông báo
//         res.redirect('/patient/profile');
//     } catch (error) {
//         console.error('Update failed:', error);
//         res.status(500).send('Update failed');
//     }
// });
// router.post('/profile', async (req, res) => {
//     // if (!req.session.auth || req.session.authUser.roleName !== 'patient') {
//     //     return res.redirect('/account/login');
//     // }

//     const userId = req.session.user_id;
//     const { fullname, phone, birthday, email, gender, address } = req.body;

//     const sql = `
//         UPDATE users
//         SET fullName = ?, phoneNumber = ?, dob = ?, email = ?, gender = ?, address = ?
//         WHERE userId = ?
//     `;

//     try {
//         await db.query(sql, [fullname, phone, birthday, email, gender, address, userId]);

//         // Cập nhật lại session nếu cần
//         req.session.authUser.fullName = fullname;
//         req.session.authUser.phoneNumber = phone;
//         req.session.authUser.dob = birthday;
//         req.session.authUser.email = email;
//         req.session.authUser.gender = gender;
//         req.session.authUser.address = address;

//         res.redirect('/patient/profile');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error updating profile');
//     }
// });
router.get('/changePass', async function (req, res) {
    res.render('vwPatient/individualPage/changePass');
});
router.post('/changePass', async (req, res) => {
    const userId = req.session.authUser.userId;
    const newPassword = req.body.new_password;

    try {
        // Mã hóa và cập nhật
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const success = await userService.update(userId, { password: hashedPassword });

        if (success) {
            return res.render('vwPatient/individualPage/changePass', {
                success: 'Changed password successfully'
            });
        } else {
            return res.render('vwPatient/individualPage/changePass', {
                error: 'Cannot updated password'
            });
        }
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