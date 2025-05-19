import express from 'express';
import bookAppointmentService from '../../services/patient/book_appointment.service.js';
import { isValidEmail, isValidPhoneNumber, calculateTotalAmount } from '../../ultis/helpers.js';
import Specialty from '../../models/Specialty.js';
import Doctor from '../../models/Doctor.js';
import Service from '../../models/Service.js';
import Appointment from '../../models/Appointment.js';

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

        console.log('Processed appointmentData:', appointmentData);

        // Add the selected service to the services array if provided
        if (req.body.serviceId) {
            appointmentData.services.push(req.body.serviceId);
            console.log('Added service ID to services array:', req.body.serviceId);
        }

        // Validate required fields
        if (!appointmentData.email || !isValidEmail(appointmentData.email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }

        if (!appointmentData.phoneNumber || !isValidPhoneNumber(appointmentData.phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }

        // Create appointment and send verification email
        console.log('Creating appointment with data:', appointmentData);
        const result = await bookAppointmentService.createAppointment(appointmentData);
        console.log('Appointment creation result:', result);

        if (result.success) {
            // Store appointment data in session for later use
            req.session.appointmentData = {
                appointmentId: result.appointmentId,
                email: result.email
            };
            
            console.log('Updated session with appointment data:', req.session.appointmentData);

            res.json({
                success: true,
                redirectUrl: '/patient/book-appointment/verify-email'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Failed to create appointment'
            });
        }
 
        console.log('Current session:', req.session);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
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
        const availableDates = await bookAppointmentService.getAvailableDatesForSpecialty(specialtyId);
        
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

        const result = await bookAppointmentService.verifyEmail(email, verificationCode);
        console.log('Verification result:', result);

        if (result.success) {
            // Update appointment ID in session
            req.session.appointmentData.appointmentId = result.appointmentId;
            
            res.json({
                success: true,
                redirectUrl: '/patient/book-appointment/make-payment'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Invalid verification code'
            });
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Step 3: Show payment form
router.get('/make-payment', async function (req, res) {
    try {
        // Set current step for UI highlighting
        res.locals.currentStep = 'make-payment';
        
        if (!req.session.appointmentData) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        const { appointmentId } = req.session.appointmentData;
        const appointmentDetails = await bookAppointmentService.getAppointmentDetails(appointmentId);

        // Calculate total amount
        const totalAmount = calculateTotalAmount(appointmentDetails.services);

        res.render('vwPatient/bookAppointment/makePayment', {
            appointment: appointmentDetails,
            totalAmount: totalAmount
        });
    } catch (error) {
        console.error('Error loading payment page:', error);
        res.redirect('/patient/book-appointment/input-form');
    }
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
        const paymentData = {
            amount: req.body.amount,
            method: req.body.paymentMethod,
            transactionId: req.body.transactionId
        };

        const result = await bookAppointmentService.processPayment(appointmentId, paymentData);

        if (result.success) {
            // Keep appointment ID for viewing but update session data
            req.session.appointmentData = {
                appointmentId: appointmentId,
                paymentComplete: true
            };

            res.json({
                success: true,
                redirectUrl: `/patient/book-appointment/view-appointment?id=${appointmentId}`
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Payment processing failed'
            });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Step 4: Show appointment details
router.get('/view-appointment', async function (req, res) {
    try {
        // Set current step for UI highlighting
        res.locals.currentStep = 'view-appointment';
        
        const appointmentId = req.query.id;
        const appointmentDetails = await bookAppointmentService.getAppointmentDetails(appointmentId);

        if (!appointmentDetails) {
            return res.redirect('/patient/book-appointment/input-form');
        }

        // Store appointment ID in session for navigation
        if (!req.session.appointmentData) {
            req.session.appointmentData = {};
        }
        req.session.appointmentData.appointmentId = appointmentId;

        res.render('vwPatient/bookAppointment/viewAppointment', {
            appointment: appointmentDetails
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