import express from 'express';
import check from '../middlewares/auth.route.js'
import userService from '../services/user.service.js';
import accountService from '../services/account.service.js';
import bcrypt from 'bcryptjs';
import axios from 'axios'
import moment from 'moment';


const router = express.Router();

router.get('/is-available-email', async function (req, res) {
    const email = req.query.email;
    // Get the userId we might need to exclude (for editing scenarios)
    const excludeUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    // Basic validation: If email is empty, treat it as 'available' for this check
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.json(true); // Don't flag empty email as unavailable
    }

    // Validate email format (basic) - prevent unnecessary DB lookups
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Invalid format, treat as 'unavailable' to prevent submission
        // Or return a specific error if needed by frontend
        return res.json(false);
    }


    try {
        const user = await userService.findByEmail(email.trim()); // Trim whitespace

        if (user) {
            // Email exists in the database
            if (excludeUserId && user.userId === excludeUserId) {
                // The email belongs to the user currently being edited, so it's 'available' for them to keep.
                return res.json(true);
            } else {
                // The email exists and belongs to a DIFFERENT user (or we are in 'add' mode with no excludeUserId).
                return res.json(false); // Not available
            }
        } else {
            // Email does not exist in the database.
            return res.json(true); // Available
        }
    } catch (error) {
        console.error("Error checking email availability:", error);
        // On server error, conservatively return false to prevent potential duplicates
        return res.status(500).json(false);
    }
});

router.get('/login', async function (req, res) {
    if (req.session.auth) {
        return res.redirect('/');
    }
    res.render('login',{
        layout: 'patient'           
    });
});

router.post('/login', async function (req, res) {
    const user = await userService.findByEmail(req.body.username);

    if (!user) {
        return res.render('login', {
            layout: 'patient',
            showErrors: true
        });
    }
    
    if (!bcrypt.compareSync(req.body.raw_password, user.password)) {
        return res.render('login', {
            layout: 'patient',
            showErrors: true
        });
    }


    req.session.auth = true;
    req.session.authUser = user;
    req.session.authUser.roleName = user.roleId == 1 ? 'admin' : user.roleId == 2 ? 'doctor' : user.roleId == 3 ? 'patient' : 'labtech';

    if (user.roleId == 2) {
        req.session.authUser.doctorId = await accountService.getDoctorId(user.userId);
        req.session.authUser.specialtyName = await accountService.getDoctorSpecialtyName(user.userId);
    }
    let redirectUrl = '/'; // Default redirect URL

    switch (user.roleId) {
        case 1:
            redirectUrl = '/admin'; // URL for admin
            break;
        case 2:
            redirectUrl = '/doctor'; // URL for doctor
            break;
        case 3:
            redirectUrl = '/'; // URL for patient
            break;
        case 4:
            redirectUrl = '/labtech'; // URL for lab technician
            break;
    }    
    res.redirect(redirectUrl);
});



router.post('/logout', check, function (req, res) {
    req.session.auth = false;
    req.session.authUser = null;
    res.redirect('/');
    console.log('logged out');
});

router.post('/signup', async function (req, res) {

    try {
        const { name, email, phone, birthday, gender, address, password } = req.body;
        // 3. Mã hóa mật khẩu
        const hashedPassword = bcrypt.hashSync(password, 8);
        const ymd_dob = moment(birthday,'DD/MM/YYYY').format('YYYY-MM-DD');

        // 4. Tạo đối tượng user
        const user = {
            fullName: name,
            email,
            phoneNumber: phone,
            dob: ymd_dob,
            gender,
            address,
            password: hashedPassword,
            roleId: 3,
        };
        console.log(user)
        // 5. Lưu vào CSDL
        const new_user = await userService.add(user);
        
        // 6. Tạo session
        req.session.auth = true;
        req.session.authUser = new_user;
        req.session.authUser.roleName = "patient";


        // 7. Chuyển hướng về trang chủ
        return res.redirect('/');
    }catch (error) {
        console.error('Fail to sign up:', error);
        return res.render('signup', {
            error: 'An error occurred while signing up. Please try again later.'
        });
    }
});

router.get('/signup', async function (req, res) {
    res.render('signup');
});

export default router;