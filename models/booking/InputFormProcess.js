import BookingProcess from './BookingProcess.js';
import { isValidEmail, isValidPhoneNumber, parseDateString } from '../../ultis/helpers.js';
import User from '../User.js';
import Patient from '../Patient.js';
import Appointment from '../Appointment.js';
import AppointmentService from '../AppointmentService.js';
import Service from '../Service.js';
import EmailVerification from '../EmailVerification.js';

export default class InputFormProcess extends BookingProcess {
    async validateRequest() {
        const { email, phone: phoneNumber } = this.req.body;

        if (!email || !isValidEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
            throw new Error('Invalid phone number');
        }
    }

    async processData() {
        const appointmentData = {
            fullName: this.req.body.name,
            email: this.req.body.email,
            phoneNumber: this.req.body.phone,
            birthday: this.req.body.birthday,
            gender: this.req.body.gender,
            address: this.req.body.address,
            specialtyId: this.req.body.specialtyId,
            appointmentDate: this.req.body.appointmentDate,
            symptom: this.req.body.symptom,
            services: this.req.body.serviceId ? [this.req.body.serviceId] : []
        };

        // Get or create user
        let user = await User.findByEmail(appointmentData.email);
        if (!user) {
            user = new User({
                email: appointmentData.email,
                fullName: appointmentData.fullName,
                phoneNumber: appointmentData.phoneNumber,
                address: appointmentData.address,
                gender: appointmentData.gender,
                dob: parseDateString(appointmentData.birthday),
                role: 'patient'
            });
            await user.save();
        }

        // Get or create patient
        let patient = await Patient.findByUserId(user.userId);
        if (!patient) {
            patient = new Patient({
                userId: user.userId,
                dob: parseDateString(appointmentData.birthday),
                gender: appointmentData.gender || 'other'
            });
            await patient.save();
        }

        // Format appointment date and get assignment details
        const formattedAppointmentDate = parseDateString(appointmentData.appointmentDate);
        let doctorId = this.req.body.doctorId || null;
        let roomId = null;
        let queueNumber = 1;
        let estimatedTime = null;

        if (!doctorId) {
            const assignment = await Appointment.assignDoctorAndRoom(appointmentData.specialtyId, formattedAppointmentDate);
            if (assignment) {
                doctorId = assignment.doctorId;
                roomId = assignment.roomId;
                queueNumber = assignment.queueNumber;
                estimatedTime = assignment.estimatedTime;
            }
        } else {
            const doctorInfo = await Doctor.findById(doctorId);
            if (doctorInfo && doctorInfo.roomId) {
                roomId = doctorInfo.roomId;
            }
            const highestQueue = await Appointment.getHighestQueueNumber(appointmentData.specialtyId, formattedAppointmentDate);
            queueNumber = highestQueue + 1;
            estimatedTime = await Appointment.calculateEstimatedTime(doctorId, formattedAppointmentDate, queueNumber);
        }

        return {
            appointmentData,
            patient,
            formattedAppointmentDate,
            doctorId,
            roomId,
            queueNumber,
            estimatedTime
        };
    }

    async saveToDatabase(data) {
        // Create appointment
        const appointment = new Appointment({
            patientId: data.patient.patientId,
            specialtyId: data.appointmentData.specialtyId,
            appointmentDate: data.formattedAppointmentDate,
            appointmentTime: data.estimatedTime,
            reason: data.appointmentData.symptom,
            doctorId: data.doctorId,
            roomId: data.roomId,
            queueNumber: data.queueNumber,
            estimatedTime: data.estimatedTime,
            status: 'pending',
            emailVerified: false
        });
        const savedAppointment = await appointment.save();

        // Add services if selected
        if (data.appointmentData.services.length > 0) {
            const serviceId = data.appointmentData.services[0];
            const service = await Service.findById(serviceId);
            if (service) {
                const appointmentService = new AppointmentService({
                    appointmentId: savedAppointment.appointmentId,
                    serviceId: service.serviceId,
                    price: service.price
                });
                await appointmentService.save();
            }
        }

        // Create email verification
        const emailVerification = await EmailVerification.create(data.appointmentData.email, savedAppointment.appointmentId);
        await emailVerification.sendVerificationEmail();

        return { 
            appointment: savedAppointment,
            emailVerification,
            appointmentData: data.appointmentData
        };
    }

    async handleNextStep(data) {
        // Store appointment data in session
        this.req.session.appointmentData = {
            appointmentId: data.appointmentData.appointmentId,
            email: data.appointmentData.email
        };

        this.res.json({
            success: true,
            redirectUrl: '/patient/book-appointment/verify-email'
        });
    }
} 