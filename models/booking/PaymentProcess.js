import BookingProcess from './BookingProcess.js';
import Appointment from '../Appointment.js';
import AppointmentService from '../AppointmentService.js';
import Payment from '../Payment.js';
import VNPay from '../VNPay.js';

export default class PaymentProcess extends BookingProcess {
    async validateRequest() {
        if (!this.req.session.appointmentData) {
            throw new Error('No appointment data found');
        }

        const { amount } = this.req.body;
        if (!amount) {
            throw new Error('Payment amount is required');
        }
    }

    async processData() {
        const { appointmentId } = this.req.session.appointmentData;
        const { amount } = this.req.body;

        // Get IP address for VNPay
        const ipAddr = this.req.headers['x-forwarded-for'] || 
                      this.req.connection.remoteAddress || 
                      this.req.socket.remoteAddress || 
                      this.req.connection.socket.remoteAddress;

        // Create VNPay payment URL
        const paymentUrl = await VNPay.createPaymentUrl(appointmentId, amount, ipAddr);

        return { paymentUrl, amount, appointmentId };
    }

    async saveToDatabase(data) {
        // Payment record will be created when VNPay returns
        return data;
    }

    async handleNextStep(data) {
        this.res.json({
            success: true,
            paymentUrl: data.paymentUrl
        });
    }

    /**
     * Handle VNPay return callback
     */
    async handlePaymentReturn(vnpParams) {
        const paymentStatus = VNPay.getPaymentStatus(vnpParams);

        if (!paymentStatus.status) {
            throw new Error(paymentStatus.message || 'Payment failed');
        }

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
            amount: parseFloat(vnpParams.vnp_Amount) / 100,
            method: 'bank_transfer',
            status: 'completed',
            transactionId: vnpParams.vnp_TransactionNo,
            paymentDate: new Date(),
            notes: `VNPay Transaction Reference: ${vnpParams.vnp_TxnRef}`
        };

        // Save payment
        await Payment.create(paymentData);

        // Update appointment status
        await Appointment.update(appointmentId, {
            status: 'confirmed',
            paymentStatus: 'completed'
        });

        return { appointment, payment: paymentData };
    }
} 