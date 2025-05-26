import BookingProcess from './BookingProcess.js';
import Appointment from '../Appointment.js';
import AppointmentService from '../AppointmentService.js';

export default class ViewAppointmentProcess extends BookingProcess {
    async validateRequest() {
        const appointmentId = this.req.query.id;
        if (!appointmentId) {
            throw new Error('Appointment ID is required');
        }
    }

    async processData() {
        const appointmentId = this.req.query.id;
        const appointment = await Appointment.findByIdWithDetails(appointmentId);

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Get services for this appointment
        const appointmentServices = await AppointmentService.findByAppointmentId(appointmentId);
        appointment.services = appointmentServices;

        return { appointment };
    }

    async saveToDatabase(data) {
        // Store appointment ID in session for navigation
        if (!this.req.session.appointmentData) {
            this.req.session.appointmentData = {};
        }
        this.req.session.appointmentData.appointmentId = data.appointmentData.appointmentId;

        return data;
    }

    async handleNextStep(data) {
        this.res.render('vwPatient/bookAppointment/viewAppointment', {
            appointment: data.appointment
        });
    }

    async handleError(error) {
        console.error('Error loading appointment details:', error);
        this.res.redirect('/patient/book-appointment/input-form');
    }
} 