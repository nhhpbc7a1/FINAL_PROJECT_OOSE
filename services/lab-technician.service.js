import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'Specialty.name as specialtyName'
                )
                .orderBy('User.fullName');
        } catch (error) {
            console.error('Error fetching lab technicians:', error);
            throw new Error('Unable to load lab technicians');
        }
    },

    async findById(technicianId) {
        try {
            const technician = await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'Specialty.name as specialtyName'
                )
                .where('LabTechnician.technicianId', technicianId)
                .first();
            return technician || null;
        } catch (error) {
            console.error(`Error fetching lab technician with ID ${technicianId}:`, error);
            throw new Error('Unable to find lab technician');
        }
    },

    async findByUserId(userId) {
        try {
            const technician = await db('LabTechnician')
                .where('userId', userId)
                .first();
            return technician || null;
        } catch (error) {
            console.error(`Error fetching lab technician with user ID ${userId}:`, error);
            throw new Error('Unable to find lab technician');
        }
    },

    async findBySpecialty(specialtyId) {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .select(
                    'LabTechnician.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.accountStatus'
                )
                .where('LabTechnician.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active')
                .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error fetching lab technicians for specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find lab technicians by specialty');
        }
    },

    async findBySpecialization(specialization) {
        try {
            return await db('LabTechnician')
                .join('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'LabTechnician.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.accountStatus',
                    'Specialty.name as specialtyName'
                )
                .where('LabTechnician.specialization', 'like', `%${specialization}%`)
                .andWhere('User.accountStatus', 'active')
                .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error fetching lab technicians with specialization like ${specialization}:`, error);
            throw new Error('Unable to find lab technicians by specialization');
        }
    },

    async add(technician) {
        try {
            const [technicianId] = await db('LabTechnician').insert(technician);
            return technicianId;
        } catch (error) {
            console.error('Error adding lab technician:', error);
            throw new Error('Unable to add lab technician');
        }
    },

    async update(technicianId, technician) {
        try {
            const result = await db('LabTechnician')
                .where('technicianId', technicianId)
                .update(technician);
            return result > 0;
        } catch (error) {
            console.error(`Error updating lab technician with ID ${technicianId}:`, error);
            throw new Error('Unable to update lab technician');
        }
    },

    async delete(technicianId) {
        try {
            const result = await db('LabTechnician')
                .where('technicianId', technicianId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting lab technician with ID ${technicianId}:`, error);
            throw new Error('Unable to delete lab technician');
        }
    },

    async countBySpecialization() {
        try {
            return await db('LabTechnician')
                .select('specialization')
                .count('technicianId as count')
                .groupBy('specialization');
        } catch (error) {
            console.error('Error counting lab technicians by specialization:', error);
            throw new Error('Unable to count lab technicians by specialization');
        }
    },

    async countBySpecialty() {
        try {
            return await db('LabTechnician')
                .leftJoin('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                .select(db.raw('IFNULL(Specialty.name, "General") as specialtyName'))
                .count('LabTechnician.technicianId as count')
                .groupBy('LabTechnician.specialtyId');
        } catch (error) {
            console.error('Error counting lab technicians by specialty:', error);
            throw new Error('Unable to count lab technicians by specialty');
        }
    },

    async getTechnicianWithTestResults(technicianId) {
        try {
            // Get technician details
            const technician = await this.findById(technicianId);
            
            if (!technician) return null;
            
            // Get test results processed by the technician
            const results = await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate'
                )
                .where('TestResult.technicianId', technicianId)
                .orderBy('TestResult.performedDate', 'desc');
            
            // Count results by status
            const statusCounts = await db('TestResult')
                .select('status')
                .count('resultId as count')
                .where('technicianId', technicianId)
                .groupBy('status');
            
            // Return technician with results and counts
            return {
                ...technician,
                results,
                statusCounts: statusCounts.reduce((acc, curr) => {
                    acc[curr.status] = curr.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error(`Error fetching technician with test results for ID ${technicianId}:`, error);
            throw new Error('Unable to get technician with test results');
        }
    }
}; 