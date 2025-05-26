import PaymentDAO from '../dao/PaymentDAO.js';

class Payment {
    constructor({ paymentId, appointmentId, amount, method, status, transactionId, paymentDate, notes }) {
        this.paymentId = paymentId;
        this.appointmentId = appointmentId;
        this.amount = amount;
        this.method = method;
        this.status = status || 'pending';
        this.transactionId = transactionId;
        this.paymentDate = paymentDate;
        this.notes = notes;
    }

    static async create(paymentData) {
        try {
            const paymentId = await PaymentDAO.create(paymentData);
            return paymentId;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    static async findById(paymentId) {
        try {
            const payment = await PaymentDAO.findById(paymentId);
            return payment ? new Payment(payment) : null;
        } catch (error) {
            console.error('Error finding payment:', error);
            throw error;
        }
    }

    static async findByAppointmentId(appointmentId) {
        try {
            const payment = await PaymentDAO.findByAppointmentId(appointmentId);
            return payment ? new Payment(payment) : null;
        } catch (error) {
            console.error('Error finding payment for appointment:', error);
            throw error;
        }
    }

    static async update(paymentId, updateData) {
        try {
            await PaymentDAO.update(paymentId, updateData);
        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    }
}

export default Payment; 