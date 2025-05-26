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
import InputFormProcess from '../../models/booking/InputFormProcess.js';
import EmailVerificationProcess from '../../models/booking/EmailVerificationProcess.js';
import PaymentProcess from '../../models/booking/PaymentProcess.js';
import ViewAppointmentProcess from '../../models/booking/ViewAppointmentProcess.js';

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
        } catch (error) {
            console.error('Error loading specialties:', error);
            try {
                specialties = await Specialty.findAll();
            } catch (fallbackErr) {
                console.error('Error loading all specialties:', fallbackErr);
            }
        }
        
        // Initialize variables
        let doctors = [];
        let services = [];
        const selectedSpecialtyId = req.query.specialtyId;
        
        if (selectedSpecialtyId) {
            try {
                doctors = await Doctor.findBySpecialty(selectedSpecialtyId);
                services = await Service.findBySpecialty(selectedSpecialtyId);
            } catch (error) {
                console.error('Error loading specialty data:', error);
            }
        }

        // Get user info if logged in
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

// Handle form submission using Template Method Pattern
router.post('/input-form', async function (req, res) {
    const process = new InputFormProcess(req, res);
    await process.execute();
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
    res.locals.currentStep = 'verify-email';
    
    if (!req.session.appointmentData) {
        return res.redirect('/patient/book-appointment/input-form');
    }
    
    res.render('vwPatient/bookAppointment/verifyEmail');
});

// Handle email verification using Template Method Pattern
router.post('/verify-email', async function (req, res) {
    const process = new EmailVerificationProcess(req, res);
    await process.execute();
});

// Step 3: Show payment form
router.get('/make-payment', async function (req, res) {
    try {
        if (!req.session.appointmentData) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        const { appointmentId } = req.session.appointmentData;
        const appointment = await Appointment.findByIdWithDetails(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const appointmentServices = await AppointmentService.findByAppointmentId(appointmentId);
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

// Handle payment using Template Method Pattern
router.post('/process-payment', async function (req, res) {
    const process = new PaymentProcess(req, res);
    await process.execute();
});

// Handle VNPay return using Template Method Pattern
router.get('/vnpay-return', async function (req, res) {
    try {
        const process = new PaymentProcess(req, res);
        const result = await process.handlePaymentReturn(req.query);
        
        // Update session data
        req.session.appointmentData = {
            appointmentId: result.appointment.appointmentId,
            paymentComplete: true
        };

        res.redirect('/patient/book-appointment/success');
    } catch (error) {
        console.error('Error handling payment return:', error);
        res.render('vwPatient/bookAppointment/paymentError', {
            message: 'Có lỗi xảy ra trong quá trình xử lý thanh toán: ' + error.message
        });
    }
});

// Step 4: Show appointment details using Template Method Pattern
router.get('/view-appointment', async function (req, res) {
    const process = new ViewAppointmentProcess(req, res);
    await process.execute();
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