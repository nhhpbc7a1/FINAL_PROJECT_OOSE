import db from '../../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('TestRequest')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentDate'
                )
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error('Error fetching test requests:', error);
            throw new Error('Unable to load test requests');
        }
    },

    async findById(requestId) {
        try {
            const result = await db('TestRequest')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'Service.description as serviceDescription',
                    'User.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentDate',
                    'Patient.patientId'
                )
                .where('TestRequest.requestId', requestId)
                .first();
            return result || null;
        } catch (error) {
            console.error(`Error fetching test request with ID ${requestId}:`, error);
            throw new Error('Unable to find test request');
        }
    },

    async findByAppointment(appointmentId) {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as doctorName'
                )
                .where('TestRequest.appointmentId', appointmentId)
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test requests for appointment ID ${appointmentId}:`, error);
            throw new Error('Unable to find test requests by appointment');
        }
    },

    async findByStatus(status) {
        try {
            return await db('TestRequest')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .leftJoin('User as DoctorUser', 'Doctor.userId', '=', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as patientName',
                    'DoctorUser.fullName as doctorName',
                    'Appointment.appointmentDate',
                    'Patient.patientId'
                )
                .where('TestRequest.status', status)
                .orderBy('TestRequest.requestDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test requests with status ${status}:`, error);
            throw new Error('Unable to find test requests by status');
        }
    },

    async add(testRequest) {
        try {
            const [requestId] = await db('TestRequest').insert(testRequest);
            return requestId;
        } catch (error) {
            console.error('Error adding test request:', error);
            throw new Error('Unable to add test request');
        }
    },

    async update(requestId, testRequest) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update(testRequest);
            return result > 0;
        } catch (error) {
            console.error(`Error updating test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request');
        }
    },

    async updateStatus(requestId, status) {
        try {
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for test request with ID ${requestId}:`, error);
            throw new Error('Unable to update test request status');
        }
    },

    async delete(requestId) {
        try {
            // First check if there are any test results linked to this request
            const testResults = await db('TestResult')
                .where('requestId', requestId)
                .count('resultId as count')
                .first();
            
            if (testResults && testResults.count > 0) {
                throw new Error('Cannot delete request with linked test results. Please delete the results first.');
            }
            
            const result = await db('TestRequest')
                .where('requestId', requestId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test request with ID ${requestId}:`, error);
            throw new Error(error.message || 'Unable to delete test request');
        }
    },

    async countByStatus() {
        try {
            return await db('TestRequest')
                .select('status')
                .count('requestId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting test requests by status:', error);
            throw new Error('Unable to count test requests by status');
        }
    },

    async countByDoctor() {
        try {
            return await db('TestRequest')
                .join('Doctor', 'TestRequest.requestedByDoctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select('User.fullName as doctorName', 'Doctor.doctorId')
                .count('TestRequest.requestId as count')
                .groupBy('TestRequest.requestedByDoctorId')
                .orderBy('count', 'desc');
        } catch (error) {
            console.error('Error counting test requests by doctor:', error);
            throw new Error('Unable to count test requests by doctor');
        }
    },

    async getPendingRequestsByService() {
        try {
            return await db('TestRequest')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .select('Service.name', 'Service.serviceId')
                .count('TestRequest.requestId as pendingCount')
                .where('TestRequest.status', 'pending')
                .groupBy('TestRequest.serviceId')
                .orderBy('pendingCount', 'desc');
        } catch (error) {
            console.error('Error counting pending requests by service:', error);
            throw new Error('Unable to count pending requests by service');
        }
    },

    /**
     * Lấy tất cả các test đang hoạt động, nhóm theo category
     * @returns {Promise<Object>} - { category: [service, ...], ... }
     */
    async getAllActiveTestsByCategory() {
        try {
            const tests = await db('Service')
                .select('serviceId', 'name', 'description', 'category', 'price', 'duration')
                .where({ type: 'test', status: 'active' });
            // Nhóm theo category
            const grouped = {};
            for (const test of tests) {
                if (!grouped[test.category]) grouped[test.category] = [];
                grouped[test.category].push(test);
            }
            return grouped;
        } catch (error) {
            console.error('Error fetching active tests by category:', error);
            throw new Error('Unable to load active tests');
        }
    }
}; 