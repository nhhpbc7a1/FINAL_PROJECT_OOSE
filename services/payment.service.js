import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Payment.*',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate',
                    'Specialty.name as specialtyName'
                )
                .orderBy('Payment.paymentDate', 'desc');
        } catch (error) {
            console.error('Error fetching payments:', error);
            throw new Error('Unable to load payments');
        }
    },

    async findById(paymentId) {
        try {
            const payment = await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Doctor', 'Appointment.doctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'Payment.*',
                    'User.fullName as patientName',
                    'User.email as patientEmail',
                    'Appointment.appointmentDate',
                    'Appointment.appointmentId',
                    'Specialty.name as specialtyName',
                    'DoctorUser.fullName as doctorName'
                )
                .where('Payment.paymentId', paymentId)
                .first();
            return payment || null;
        } catch (error) {
            console.error(`Error fetching payment with ID ${paymentId}:`, error);
            throw new Error('Unable to find payment');
        }
    },

    async findByAppointment(appointmentId) {
        try {
            const payment = await db('Payment')
                .where('appointmentId', appointmentId)
                .first();
            return payment || null;
        } catch (error) {
            console.error(`Error fetching payment for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find payment by appointment');
        }
    },

    async findByPatient(patientId) {
        try {
            return await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .leftJoin('Specialty', 'Appointment.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Payment.*',
                    'Appointment.appointmentDate',
                    'Specialty.name as specialtyName'
                )
                .where('Appointment.patientId', patientId)
                .orderBy('Payment.paymentDate', 'desc');
        } catch (error) {
            console.error(`Error fetching payments for patient ID ${patientId}:`, error);
            throw new Error('Unable to find payments by patient');
        }
    },

    async findByStatus(status) {
        try {
            return await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Payment.*',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate'
                )
                .where('Payment.status', status)
                .orderBy('Payment.paymentDate', 'desc');
        } catch (error) {
            console.error(`Error fetching payments with status ${status}:`, error);
            throw new Error('Unable to find payments by status');
        }
    },

    async findByMethod(method) {
        try {
            return await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Payment.*',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate'
                )
                .where('Payment.method', method)
                .orderBy('Payment.paymentDate', 'desc');
        } catch (error) {
            console.error(`Error fetching payments with method ${method}:`, error);
            throw new Error('Unable to find payments by method');
        }
    },

    async findByDateRange(startDate, endDate) {
        try {
            return await db('Payment')
                .join('Appointment', 'Payment.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'Payment.*',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate'
                )
                .whereBetween('Payment.paymentDate', [startDate, endDate])
                .orderBy('Payment.paymentDate', 'desc');
        } catch (error) {
            console.error(`Error fetching payments between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to find payments by date range');
        }
    },

    async add(payment) {
        try {
            const [paymentId] = await db('Payment').insert(payment);
            
            // Update appointment payment status
            if (payment.appointmentId && payment.status === 'completed') {
                await db('Appointment')
                    .where('appointmentId', payment.appointmentId)
                    .update({ paymentStatus: 'completed' });
            }
            
            return paymentId;
        } catch (error) {
            console.error('Error adding payment:', error);
            throw new Error('Unable to add payment');
        }
    },

    async update(paymentId, payment) {
        try {
            const result = await db('Payment')
                .where('paymentId', paymentId)
                .update(payment);
            
            // If updating payment status, also update appointment
            if (payment.status) {
                const updatedPayment = await db('Payment')
                    .where('paymentId', paymentId)
                    .first();
                
                if (updatedPayment) {
                    await db('Appointment')
                        .where('appointmentId', updatedPayment.appointmentId)
                        .update({ paymentStatus: payment.status });
                }
            }
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating payment with ID ${paymentId}:`, error);
            throw new Error('Unable to update payment');
        }
    },

    async updateStatus(paymentId, status) {
        try {
            const result = await db('Payment')
                .where('paymentId', paymentId)
                .update({ status });
            
            // Also update appointment payment status
            const payment = await db('Payment')
                .where('paymentId', paymentId)
                .first();
            
            if (payment) {
                await db('Appointment')
                    .where('appointmentId', payment.appointmentId)
                    .update({ paymentStatus: status });
            }
            
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for payment with ID ${paymentId}:`, error);
            throw new Error('Unable to update payment status');
        }
    },

    async delete(paymentId) {
        try {
            const result = await db('Payment')
                .where('paymentId', paymentId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting payment with ID ${paymentId}:`, error);
            throw new Error('Unable to delete payment');
        }
    },

    async getPaymentInvoice(paymentId) {
        try {
            // Get payment details
            const payment = await this.findById(paymentId);
            
            if (!payment) return null;
            
            // Get services associated with the appointment
            const services = await db('AppointmentServices')
                .join('Service', 'AppointmentServices.serviceId', '=', 'Service.serviceId')
                .select(
                    'Service.name',
                    'Service.type',
                    'AppointmentServices.price'
                )
                .where('AppointmentServices.appointmentId', payment.appointmentId);
            
            // Prepare invoice with all details
            return {
                ...payment,
                services,
                totalServiceCost: services.reduce((sum, service) => sum + parseFloat(service.price), 0)
            };
        } catch (error) {
            console.error(`Error generating invoice for payment ID ${paymentId}:`, error);
            throw new Error('Unable to generate payment invoice');
        }
    },

    async countByStatus() {
        try {
            return await db('Payment')
                .select('status')
                .count('paymentId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting payments by status:', error);
            throw new Error('Unable to count payments by status');
        }
    },

    async countByMethod() {
        try {
            return await db('Payment')
                .select('method')
                .count('paymentId as count')
                .groupBy('method');
        } catch (error) {
            console.error('Error counting payments by method:', error);
            throw new Error('Unable to count payments by method');
        }
    },

    async getTotalRevenue(period = 'all') {
        try {
            let query = db('Payment')
                .where('status', 'completed')
                .sum('amount as totalRevenue')
                .first();
            
            // Add time period filter if specified
            if (period === 'today') {
                query = query.whereRaw('DATE(paymentDate) = CURDATE()');
            } else if (period === 'week') {
                query = query.whereRaw('paymentDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
            } else if (period === 'month') {
                query = query.whereRaw('paymentDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
            } else if (period === 'year') {
                query = query.whereRaw('paymentDate >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)');
            }
            
            const result = await query;
            return result.totalRevenue || 0;
        } catch (error) {
            console.error(`Error calculating total revenue for period ${period}:`, error);
            throw new Error('Unable to calculate total revenue');
        }
    },

    async getRevenueByDateRange(startDate, endDate, groupBy = 'day') {
        try {
            let dateFormat = '%Y-%m-%d'; // Default: group by day
            
            if (groupBy === 'month') {
                dateFormat = '%Y-%m';
            } else if (groupBy === 'year') {
                dateFormat = '%Y';
            }
            
            return await db('Payment')
                .select(db.raw(`DATE_FORMAT(paymentDate, '${dateFormat}') as date`))
                .sum('amount as revenue')
                .where('status', 'completed')
                .whereBetween('paymentDate', [startDate, endDate])
                .groupByRaw(`DATE_FORMAT(paymentDate, '${dateFormat}')`)
                .orderBy('date');
        } catch (error) {
            console.error(`Error calculating revenue between ${startDate} and ${endDate} grouped by ${groupBy}:`, error);
            throw new Error('Unable to calculate revenue by date range');
        }
    }
}; 