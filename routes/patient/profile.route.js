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
    const currentPassword = req.body.password;
    const newPassword = req.body.new_password;
    const retypePassword = req.body.re_type_password;

    try {
        // Lấy user từ service
        const user = await userService.findById(userId);
        if (!user) {
            return res.render('vwPatient/individualPage/changePass', {
                error: 'User not found'
            });
        }

        // So sánh mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.render('vwPatient/individualPage/changePass', {
                error: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Kiểm tra mật khẩu mới
        if (newPassword !== retypePassword) {
            return res.render('vwPatient/individualPage/changePass', {
                error: 'Mật khẩu mới không khớp'
            });
        }

        // Mã hóa và cập nhật
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const success = await userService.update(userId, { password: hashedPassword });

        if (success) {
            return res.render('vwPatient/individualPage/changePass', {
                success: 'Đổi mật khẩu thành công'
            });
        } else {
            return res.render('vwPatient/individualPage/changePass', {
                error: 'Không thể cập nhật mật khẩu'
            });
        }

    } catch (err) {
        console.error('Change password error:', err);
        return res.render('vwPatient/individualPage/changePass', {
            error: 'Có lỗi xảy ra, vui lòng thử lại'
        });
    }
});
// router.post('/changePass', async (req, res) => {
//     const userId = req.session.authUser.userId;
//     const { currentPassword, newPassword, retypePassword } = req.body;

//     try {
//         // Lấy thông tin người dùng từ DB
//         const user = await userService.findById(userId);

//         // So sánh mật khẩu hiện tại
//         const isMatch = await bcrypt.compare(currentPassword, user.password);
//         if (!isMatch) {
//             return res.render('vwPatient/individualPage/changePass', { error: 'Current password is incorrect' });
//         }

//         // Kiểm tra mật khẩu mới và xác nhận
//         if (newPassword !== retypePassword) {
//             return res.render('vwPatient/individualPage/changePass', { error: 'New passwords do not match' });
//         }

//         // Hash mật khẩu mới và cập nhật
//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         await userService.update(userId, { password: hashedPassword });

//         res.render('vwPatient/individualPage/changePass', { success: 'Password updated successfully' });
//     } catch (err) {
//         console.error(err);
//         res.render('vwPatient/individualPage/changePass', { error: 'Something went wrong. Try again later.' });
//     }
// });
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