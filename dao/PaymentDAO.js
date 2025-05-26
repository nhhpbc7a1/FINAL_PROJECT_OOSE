import db from '../ultis/db.js';

class PaymentDAO {
    static async create(paymentData) {
        try {
            const [paymentId] = await db('Payment').insert({
                appointmentId: paymentData.appointmentId,
                amount: paymentData.amount,
                method: paymentData.method,
                status: paymentData.status || 'pending',
                transactionId: paymentData.transactionId,
                paymentDate: paymentData.paymentDate || new Date(),
                notes: paymentData.notes
            });
            return paymentId;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    static async findById(paymentId) {
        try {
            const payment = await db('Payment')
                .where('paymentId', paymentId)
                .first();
            return payment || null;
        } catch (error) {
            console.error('Error finding payment:', error);
            throw error;
        }
    }

    static async findByAppointmentId(appointmentId) {
        try {
            const payment = await db('Payment')
                .where('appointmentId', appointmentId)
                .first();
            return payment || null;
        } catch (error) {
            console.error('Error finding payment by appointment:', error);
            throw error;
        }
    }

    static async update(paymentId, updateData) {
        try {
            await db('Payment')
                .where('paymentId', paymentId)
                .update(updateData);
        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    }
}

export default PaymentDAO; 