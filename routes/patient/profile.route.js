import express from 'express';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import Appointment from '../../models/Appointment.js';
import AppointmentServiceDAO from '../../dao/AppointmentServiceDAO.js';
import MedicalRecord from '../../models/MedicalRecord.js';
import TestResult from '../../models/TestResult.js';
import Prescription from '../../models/Prescription.js';
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
    try {
        const userId = req.session.authUser?.userId;
        if (!userId) {
            return res.redirect('/auth/login');
        }

        // Get patient ID from user ID
        const patient = await Patient.findByUserId(userId);
        if (!patient) {
            return res.status(404).render('vwPatient/individualPage/appointmentList', {
                error: 'Patient profile not found'
            });
        }

        // Get appointments for this patient
        const appointments = await Appointment.findByPatient(patient.patientId);
        
        // Count appointments by status
        const statusCounts = {
            all: appointments.length,
            waiting: 0,
            completed: 0,
            cancelled: 0
        };
        
        // Format appointment data for display
        const formattedAppointments = await Promise.all(appointments.map(async appointment => {
            // Count by status
            if (appointment.status === 'confirmed') {
                statusCounts.waiting++;
            } else if (appointment.status === 'completed') {
                statusCounts.completed++;
            } else if (appointment.status === 'cancelled') {
                statusCounts.cancelled++;
            }
            
            // Get total price from services
            const totalPrice = await AppointmentServiceDAO.getTotalPrice(appointment.appointmentId);
            
            // Format price with Vietnamese currency format
            const formattedPrice = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(totalPrice || 0).replace('₫', 'VND');
            
            return {
                appointmentId: appointment.appointmentId,
                bookedDate: moment(appointment.createdDate).format('DD/MM/YYYY'),
                patientName: req.session.authUser.fullName,
                appointmentDate: moment(appointment.appointmentDate).format('DD/MM/YYYY'),
                appointmentTime: appointment.appointmentTime,
                doctorName: appointment.doctorName,
                specialtyName: appointment.specialtyName,
                totalPrice: formattedPrice,
                status: appointment.status,
                patientAppointmentStatus: appointment.patientAppointmentStatus
            };
        }));

        res.render('vwPatient/individualPage/appointmentList', {
            appointments: formattedAppointments,
            statusCounts: statusCounts
        });
    } catch (error) {
        console.error('Error loading appointments:', error);
        res.status(500).render('vwPatient/individualPage/appointmentList', {
            error: 'Failed to load appointments'
        });
    }
});

// Cancel appointment
router.post('/cancelAppointment', async function (req, res) {
    try {
        const { appointmentId } = req.body;
        const userId = req.session.authUser?.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        
        // Get patient ID
        const patient = await Patient.findByUserId(userId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
        
        // Get appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        // Check if this appointment belongs to the patient
        if (appointment.patientId !== patient.patientId) {
            return res.status(403).json({ success: false, message: 'You can only cancel your own appointments' });
        }
        
        // Update appointment status
        appointment.status = 'cancelled';
        await appointment.save();
        
        return res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
    }
});

router.get('/appointmentDetail', async function (req, res) {
    try {
        const appointmentId = req.query.id;
        const userId = req.session.authUser?.userId;
        
        if (!userId) {
            return res.redirect('/auth/login');
        }
        
        if (!appointmentId) {
            return res.redirect('/patient/profile/appointmentList');
        }
        
        // Get patient ID
        const patient = await Patient.findByUserId(userId);
        if (!patient) {
            return res.status(404).render('vwPatient/individualPage/appointmentDetail', {
                error: 'Patient profile not found'
            });
        }
        
        // Get appointment with details
        const appointment = await Appointment.findByIdWithDetails(appointmentId);
        if (!appointment) {
            return res.status(404).render('vwPatient/individualPage/appointmentDetail', {
                error: 'Appointment not found'
            });
        }
        
        // Check if this appointment belongs to the patient
        if (appointment.patientId !== patient.patientId) {
            return res.status(403).render('vwPatient/individualPage/appointmentDetail', {
                error: 'You can only view your own appointments'
            });
        }
        
        // Get services for this appointment
        const services = await AppointmentServiceDAO.findByAppointmentId(appointmentId);
        
        // Calculate total price
        const totalPrice = services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
        
        // Format services with price formatting
        const formattedServices = services.map(service => {
            return {
                ...service,
                formattedPrice: new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0
                }).format(service.price || 0).replace('₫', 'VND')
            };
        });
        
        // Get medical record if exists
        const medicalRecord = await MedicalRecord.findByAppointmentId(appointmentId);
        
        // Get test results if any
        const testResults = await TestResult.findByAppointmentId(appointmentId);
        
        // Get prescriptions if any
        const prescriptions = await Prescription.findByAppointmentId(appointmentId);
        
        // Format appointment data for display
        const formattedAppointment = {
            appointmentId: appointment.appointmentId,
            bookedDate: moment(appointment.createdDate).format('DD/MM/YYYY'),
            patientName: req.session.authUser.fullName,
            patientPhone: req.session.authUser.phoneNumber,
            patientDob: req.session.authUser.dob ? moment(req.session.authUser.dob).format('DD/MM/YYYY') : '',
            patientAddress: req.session.authUser.address || '',
            appointmentDate: moment(appointment.appointmentDate).format('DD/MM/YYYY'),
            appointmentTime: appointment.appointmentTime,
            doctorName: appointment.doctorName,
            specialtyName: appointment.specialtyName,
            reason: appointment.reason,
            roomNumber: appointment.roomNumber,
            queueNumber: appointment.queueNumber,
            status: appointment.status,
            patientAppointmentStatus: appointment.patientAppointmentStatus,
            services: formattedServices,
            totalPrice: new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(totalPrice).replace('₫', 'VND'),
            medicalRecord: medicalRecord ? {
                ...medicalRecord,
                followupDate: medicalRecord.followupDate ? moment(medicalRecord.followupDate).format('DD/MM/YYYY') : null
            } : null,
            testResults: testResults.map(result => ({
                ...result,
                performedDate: moment(result.performedDate).format('DD/MM/YYYY')
            })),
            prescriptions
        };
        
        res.render('vwPatient/individualPage/appointmentDetail', {
            appointment: formattedAppointment
        });
    } catch (error) {
        console.error('Error loading appointment details:', error);
        res.status(500).render('vwPatient/individualPage/appointmentDetail', {
            error: 'Failed to load appointment details'
        });
    }
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