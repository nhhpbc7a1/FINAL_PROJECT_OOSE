import express from 'express';
import { isValidEmail, isValidPhoneNumber, calculateTotalAmount } from '../../ultis/helpers.js';
import { generateVerificationCode, parseDateString } from '../../ultis/helpers.js';
import Specialty from '../../models/Specialty.js';
import Doctor from '../../models/Doctor.js';
import Service from '../../models/Service.js';
import Appointment from '../../models/Appointment.js';
import Patient from '../../models/Patient.js';
import User from '../../models/User.js';
import EmailVerification from '../../models/EmailVerification.js';
import AppointmentService from '../../models/AppointmentService.js';
import Payment from '../../models/Payment.js';

import VNPay from '../../models/VNPay.js';

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'bookAppointment';
    
    // Add helper functions for templates
    res.locals.helpers = {
        eq: function (a, b) {
            return a === b;
        },
        formatCurrency: function (value) {
            if (value === undefined || value === null) return '0';
            return new Intl.NumberFormat('vi-VN').format(value);
        },
        subtract: function (a, b) {
            return a - b;
        },
        or: function (a, b) {
            return a || b;
        },
        not: function (a) {
            return !a;
        }
    };
    
    // Set appointment data exists flag if available in session
    if (req.session.appointmentData) {
        res.locals.appointmentDataExists = true;
        if (req.session.appointmentData.appointmentId) {
            res.locals.appointmentId = req.session.appointmentData.appointmentId;
        }
    }
    
    next();
});

// Step 1: Show input form
router.get('/', async function (req, res) {
    res.redirect('/patient/book-appointment/input-form');
});

// Display input form with necessary data
router.get('/input-form', async function (req, res) {
    try {
        // Set current step for UI highlighting
        res.locals.currentStep = 'input-form';
        
        // Get all active specialties
        let specialties = [];
        try {
            specialties = await Specialty.getAllActive();
            console.log('specialties:', specialties);
        } catch (error) {
            console.error('Error loading specialties:', error);
            // Fall back to getting all specialties if getAllActive fails
            try {
                specialties = await Specialty.findAll();
            } catch (fallbackErr) {
                console.error('Error loading all specialties:', fallbackErr);
                // Continue with empty specialties array
            }
        }
        
        // Initialize variables
        let doctors = [];
        let services = [];
        const selectedSpecialtyId = req.query.specialtyId;
        
        if (selectedSpecialtyId) {
            // Get doctors for selected specialty
            try {
                doctors = await Doctor.findBySpecialty(selectedSpecialtyId);
            } catch (error) {
                console.error('Error loading doctors:', error);
                // Continue with empty doctors array
            }
            
            // Get services for selected specialty
            try {
                services = await Service.findBySpecialty(selectedSpecialtyId);
            } catch (error) {
                console.error('Error loading specialty services:', error);
                // Fall back to loading all services
                try {
                    services = await Service.getAllActive();
                } catch (fallbackErr) {
                    console.error('Error loading all services:', fallbackErr);
                    // Continue with empty services array
                }
            }
        }

        // If user is logged in, get their information
        let userInfo = null;
        if (req.session.auth && req.session.authUser) {
            userInfo = {
                fullName: req.session.authUser.fullName,
                email: req.session.authUser.email,
                phoneNumber: req.session.authUser.phoneNumber,
                address: req.session.authUser.address,
                gender: req.session.authUser.gender,
                dob: req.session.authUser.dob
            };
        }

        res.render('vwPatient/bookAppointment/inputForm', {
            specialties,
            services,
            doctors,
            selectedSpecialtyId,
            userInfo
        });
    } catch (error) {
        console.error('Error loading input form data:', error);
        res.render('vwPatient/bookAppointment/inputForm', {
            error: 'Failed to load form data',
            specialties: [],
            services: [],
            doctors: [],
            selectedSpecialtyId: null,
            userInfo: null
        });
    }
});

// Handle form submission
router.post('/input-form', async function (req, res) {
    try {
        console.log('Form data received:', req.body);
        
        const appointmentData = {
            fullName: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phone,
            birthday: req.body.birthday,
            gender: req.body.gender,
            address: req.body.address,
            specialtyId: req.body.specialtyId,
            appointmentDate: req.body.appointmentDate,
            symptom: req.body.symptom,
            services: []
        };

        // Add the selected service to the services array if provided
        if (req.body.serviceId) {
            appointmentData.services.push(req.body.serviceId);
        }

        // Validate required fields
        if (!appointmentData.email || !isValidEmail(appointmentData.email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        if (!appointmentData.phoneNumber || !isValidPhoneNumber(appointmentData.phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }

        // Get or create user and patient
        let user = await User.findByEmail(appointmentData.email);
        let patient;

        if (!user) {
            user = new User({
                email: appointmentData.email,
                fullName: appointmentData.fullName,
                phoneNumber: appointmentData.phoneNumber,
                address: appointmentData.address,
                gender: appointmentData.gender,
                dob: appointmentData.birthday,
                role: 'patient'
            });
            await user.save();
        }

        patient = await Patient.findByUserId(user.userId);
        if (!patient) {
            patient = new Patient({
                userId: user.userId
            });
            await patient.save();
        }

        // Format appointment date
        const formattedAppointmentDate = parseDateString(appointmentData.appointmentDate);
        let doctorId = req.body.doctorId || null;
        let roomId = null;
        let queueNumber = 1;
        let estimatedTime = null;

        if (!doctorId) {
            // Auto-assign doctor and room based on specialty and date
            const assignment = await Appointment.assignDoctorAndRoom(appointmentData.specialtyId, formattedAppointmentDate);
            if (assignment) {
                doctorId = assignment.doctorId;
                roomId = assignment.roomId;
                queueNumber = assignment.queueNumber;
                estimatedTime = assignment.estimatedTime;
            }
        } else {
            // Use selected doctor, get room and calculate queue
            const doctorInfo = await Doctor.findById(doctorId);
            if (doctorInfo && doctorInfo.roomId) {
                roomId = doctorInfo.roomId;
            }

            // Get queue number for specialty on selected date
            const highestQueue = await Appointment.getHighestQueueNumber(appointmentData.specialtyId, formattedAppointmentDate);
            queueNumber = highestQueue + 1;

            // Calculate estimated time
            estimatedTime = await Appointment.calculateEstimatedTime(doctorId, formattedAppointmentDate, queueNumber);
        }

        // Create new appointment
        const appointment = new Appointment({
            patientId: patient.patientId,
            specialtyId: appointmentData.specialtyId,
            appointmentDate: formattedAppointmentDate,
            appointmentTime: estimatedTime,
            reason: appointmentData.symptom,
            doctorId: doctorId,
            roomId: roomId,
            queueNumber: queueNumber,
            estimatedTime: estimatedTime,
            status: 'pending',
            emailVerified: false
        });
        
        await appointment.save();

        // Add service if selected
        if (appointmentData.services && appointmentData.services.length > 0) {
            const serviceId = appointmentData.services[0]; // Get the single service ID
            const service = await Service.findById(serviceId);
            if (service) {
                const appointmentService = new AppointmentService({
                    appointmentId: appointment.appointmentId,
                    serviceId: service.serviceId,
                    price: service.price
                });
                await appointmentService.save();
            }
        }

        // Create email verification
        const emailVerification = await EmailVerification.create(appointmentData.email, appointment.appointmentId);
        await emailVerification.sendVerificationEmail();

        // Store appointment data in session
        req.session.appointmentData = {
            appointmentId: appointment.appointmentId,
            email: appointmentData.email
        };

        res.json({
            success: true,
            redirectUrl: '/patient/book-appointment/verify-email'
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

// API to get available dates
router.get('/available-dates', async function (req, res) {
    try {
        const specialtyId = req.query.specialtyId;
        
        if (!specialtyId) {
            return res.status(400).json({
                success: false,
                message: 'Specialty ID is required'
            });
        }
        
        // Get dates with available schedules for the specialty
        const availableDates = await Appointment.getAvailableDatesForSpecialty(specialtyId);
        console.log(availableDates);
        return res.json({
            success: true,
            availableDates: availableDates
        });
    } catch (error) {
        console.error('Error fetching available dates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch available dates'
        });
    }
});

// Step 2: Show email verification form
router.get('/verify-email', async function (req, res) {
    // Set current step for UI highlighting
    res.locals.currentStep = 'verify-email';
    
    if (!req.session.appointmentData) {
        console.log('No appointment data in session, redirecting to input form');
        return res.redirect('/patient/book-appointment/input-form');
    }
    
    console.log('Appointment data in session:', req.session.appointmentData);
    res.render('vwPatient/bookAppointment/verifyEmail');
});

// Handle email verification
router.post('/verify-email', async function (req, res) {
    try {
        if (!req.session.appointmentData) {
            console.log('No appointment data in session for POST request');
            return res.status(400).json({
                success: false,
                message: 'No appointment data found in session'
            });
        }

        console.log('Session data for verification:', req.session.appointmentData);
        const { email } = req.session.appointmentData;
        const { verificationCode } = req.body;
        
        console.log('Verifying email:', email, 'with code:', verificationCode);

        // Find and verify the code
        const verification = await EmailVerification.findByEmailAndCode(email, verificationCode);
        
        if (!verification) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        if (verification.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired'
            });
        }

        // Verify the code
        await verification.verify(verificationCode);

        // Update appointment status
        const appointment = await Appointment.findById(verification.appointmentId);
        if (appointment) {
            appointment.emailVerified = true;
            appointment.status = 'waiting_payment';
            await appointment.save();
        }

        // Update session with appointment ID
        req.session.appointmentData.appointmentId = verification.appointmentId;
        
        res.json({
            success: true,
            redirectUrl: '/patient/book-appointment/make-payment'
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});

// Step 3: Show payment form
router.get('/make-payment', async function (req, res) {
    try {
        if (!req.session.appointmentData) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        const { appointmentId } = req.session.appointmentData;
        
        // Get appointment with details
        const appointment = await Appointment.findByIdWithDetails(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Get services for this appointment
        const appointmentServices = await AppointmentService.findByAppointmentId(appointmentId);
        
        // Calculate total amount
        const totalAmount = calculateTotalAmount(appointmentServices);

        res.render('vwPatient/bookAppointment/makePayment', {
            appointment,
            totalAmount
        });
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.redirect('/patient/book-appointment/error');
    }
});

// Add success route
router.get('/success', async function (req, res) {
    try {
        if (!req.session.appointmentData) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        // Clear appointment data from session after successful payment
        delete req.session.appointmentData;
        
        res.render('vwPatient/bookAppointment/success');
    } catch (error) {
        console.error('Error loading success page:', error);
        res.redirect('/patient/book-appointment/error');
    }
});

// Add error route
router.get('/error', async function (req, res) {
    const errorCode = req.query.code || '99';
    let errorMessage = 'An unknown error occurred';
    
    switch (errorCode) {
        case '97':
            errorMessage = 'Invalid payment signature';
            break;
        case '99':
            errorMessage = 'Payment processing error';
            break;
        default:
            errorMessage = 'Payment failed';
    }
    
    res.render('vwPatient/bookAppointment/error', {
        errorCode,
        errorMessage
    });
});

// Handle payment
router.post('/process-payment', async function (req, res) {
    try {
        if (!req.session.appointmentData) {
            return res.status(400).json({
                success: false,
                message: 'No appointment data found'
            });
        }

        const { appointmentId } = req.session.appointmentData;
        const { amount } = req.body;

        // Create VNPay payment URL
        const ipAddr = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      req.connection.socket.remoteAddress;

        const paymentUrl = await VNPay.createPaymentUrl(appointmentId, amount, ipAddr);

        res.json({
            success: true,
            paymentUrl: paymentUrl
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

// Handle VNPay return
router.get('/vnpay-return', async function (req, res) {
    try {
        const vnpParams = req.query;
        const paymentStatus = VNPay.getPaymentStatus(vnpParams);

        if (paymentStatus.status) {
            // Get the appointment ID from the order info
            const appointmentId = parseInt(vnpParams.vnp_OrderInfo.split(' ').pop());
            
            // Get the appointment
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // Create payment record
            const paymentData = {
                appointmentId: appointmentId,
                amount: parseFloat(vnpParams.vnp_Amount) / 100, // Convert from VNPay amount (in cents)
                method: 'bank_transfer',
                status: 'completed',
                transactionId: vnpParams.vnp_TransactionNo,
                paymentDate: new Date(),
                notes: `VNPay Transaction Reference: ${vnpParams.vnp_TxnRef}`
            };

            // Save payment using Payment model
            await Payment.create(paymentData);

            // Update appointment status
            await Appointment.update(appointmentId, {
                status: 'confirmed',
                paymentStatus: 'completed'
            });

            // Update session data
            req.session.appointmentData = {
                appointmentId: appointmentId,
                paymentComplete: true
            };

            // Redirect to success page
            res.redirect('/patient/book-appointment/success');
        } else {
            // Payment failed
            res.render('vwPatient/bookAppointment/paymentError', {
                message: paymentStatus.message || 'Thanh toán thất bại'
            });
        }
    } catch (error) {
        console.error('Error handling payment return:', error);
        res.render('vwPatient/bookAppointment/paymentError', {
            message: 'Có lỗi xảy ra trong quá trình xử lý thanh toán: ' + error.message
        });
    }
});

// Step 4: Show appointment details
router.get('/view-appointment', async function (req, res) {
    try {
        // Set current step for UI highlighting
        res.locals.currentStep = 'view-appointment';
        
        const appointmentId = req.query.id;
        const appointment = await Appointment.findByIdWithDetails(appointmentId);

        if (!appointment) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        // Get services for this appointment
        const appointmentServices = await AppointmentService.findByAppointmentId(appointmentId);
        appointment.services = appointmentServices;

        // Store appointment ID in session for navigation
        if (!req.session.appointmentData) {
            req.session.appointmentData = {};
        }
        req.session.appointmentData.appointmentId = appointmentId;

        res.render('vwPatient/bookAppointment/viewAppointment', {
            appointment: appointment
        });
    } catch (error) {
        console.error('Error loading appointment details:', error);
        res.redirect('/patient/book-appointment/input-form');
    }
});

// API endpoint to get services by specialty
router.get('/get-services', async function (req, res) {
    try {
        const specialtyId = req.query.specialtyId;
        
        if (!specialtyId) {
            return res.status(400).json({
                success: false,
                message: 'Specialty ID is required'
            });
        }
        
        // Get services for selected specialty
        let services = [];
        try {
            services = await Service.findBySpecialty(specialtyId);
            
            // If no specialty-specific services found, get all active services
            if (!services || services.length === 0) {
                services = await Service.getAllActive();
            }
            
            // Filter services by type if needed
            services = services.filter(service => !service.type || service.type === 'service');
            
            // Format services for the frontend
            const formattedServices = services.map(service => ({
                id: service.id || service.serviceId,
                name: service.name,
                price: service.price,
                description: service.description
            }));
            
            return res.json({
                success: true,
                services: formattedServices
            });
        } catch (error) {
            console.error('Error loading services:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to load services'
            });
        }
    } catch (error) {
        console.error('Error in get-services endpoint:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;