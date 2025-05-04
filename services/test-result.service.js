import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as technicianName',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error('Error fetching test results:', error);
            throw new Error('Unable to load test results');
        }
    },

    async findById(resultId) {
        try {
            const result = await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'Service.description as serviceDescription',
                    'User.fullName as technicianName',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath',
                    'File.fileType'
                )
                .where('TestResult.resultId', resultId)
                .first();
            return result || null;
        } catch (error) {
            console.error(`Error fetching test result with ID ${resultId}:`, error);
            throw new Error('Unable to find test result');
        }
    },

    async findByMedicalRecord(recordId) {
        try {
            return await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User', 'LabTechnician.userId', '=', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'Service.type as serviceType',
                    'User.fullName as technicianName',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .where('TestResult.recordId', recordId)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results for medical record ID ${recordId}:`, error);
            throw new Error('Unable to find test results by medical record');
        }
    },

    async findByTechnician(technicianId) {
        try {
            return await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'User.fullName as patientName',
                    'Appointment.appointmentDate'
                )
                .where('TestResult.technicianId', technicianId)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results for technician ID ${technicianId}:`, error);
            throw new Error('Unable to find test results by technician');
        }
    },

    async findByService(serviceId) {
        try {
            return await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User as TechnicianUser', 'LabTechnician.userId', '=', 'TechnicianUser.userId')
                .select(
                    'TestResult.*',
                    'User.fullName as patientName',
                    'TechnicianUser.fullName as technicianName',
                    'Appointment.appointmentDate'
                )
                .where('TestResult.serviceId', serviceId)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results for service ID ${serviceId}:`, error);
            throw new Error('Unable to find test results by service');
        }
    },

    async findByStatus(status) {
        try {
            return await db('TestResult')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', '=', 'LabTechnician.technicianId')
                .leftJoin('User as TechnicianUser', 'LabTechnician.userId', '=', 'TechnicianUser.userId')
                .select(
                    'TestResult.*',
                    'Service.name as serviceName',
                    'User.fullName as patientName',
                    'TechnicianUser.fullName as technicianName',
                    'Appointment.appointmentDate'
                )
                .where('TestResult.status', status)
                .orderBy('TestResult.performedDate', 'desc');
        } catch (error) {
            console.error(`Error fetching test results with status ${status}:`, error);
            throw new Error('Unable to find test results by status');
        }
    },

    async add(testResult) {
        try {
            const [resultId] = await db('TestResult').insert(testResult);
            return resultId;
        } catch (error) {
            console.error('Error adding test result:', error);
            throw new Error('Unable to add test result');
        }
    },

    async update(resultId, testResult) {
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update(testResult);
            return result > 0;
        } catch (error) {
            console.error(`Error updating test result with ID ${resultId}:`, error);
            throw new Error('Unable to update test result');
        }
    },

    async updateStatus(resultId, status) {
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update({ 
                    status,
                    performedDate: status === 'completed' ? db.fn.now() : db.raw('performedDate')
                });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for test result with ID ${resultId}:`, error);
            throw new Error('Unable to update test result status');
        }
    },

    async updateResultData(resultId, resultText, resultFileId = null, interpretation = null) {
        try {
            const updateData = {
                resultText,
                interpretation,
                status: 'completed',
                performedDate: db.fn.now()
            };
            
            if (resultFileId) {
                updateData.resultFileId = resultFileId;
            }
            
            const result = await db('TestResult')
                .where('resultId', resultId)
                .update(updateData);
            return result > 0;
        } catch (error) {
            console.error(`Error updating result data for test result with ID ${resultId}:`, error);
            throw new Error('Unable to update test result data');
        }
    },

    async delete(resultId) {
        try {
            const result = await db('TestResult')
                .where('resultId', resultId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting test result with ID ${resultId}:`, error);
            throw new Error('Unable to delete test result');
        }
    },

    async countByStatus() {
        try {
            return await db('TestResult')
                .select('status')
                .count('resultId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting test results by status:', error);
            throw new Error('Unable to count test results by status');
        }
    },

    async countByResultType() {
        try {
            return await db('TestResult')
                .select('resultType')
                .count('resultId as count')
                .groupBy('resultType');
        } catch (error) {
            console.error('Error counting test results by result type:', error);
            throw new Error('Unable to count test results by result type');
        }
    },

    async countByDateRange(startDate, endDate) {
        try {
            return await db('TestResult')
                .select(db.raw('DATE(performedDate) as date'))
                .count('resultId as count')
                .whereBetween('performedDate', [startDate, endDate])
                .whereNot('status', 'pending')
                .groupBy('date')
                .orderBy('date');
        } catch (error) {
            console.error(`Error counting test results between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to count test results by date range');
        }
    },

    async getPendingTestsByService() {
        try {
            return await db('TestResult')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .select('Service.name', 'Service.serviceId')
                .count('TestResult.resultId as pendingCount')
                .where('TestResult.status', 'pending')
                .groupBy('TestResult.serviceId')
                .orderBy('pendingCount', 'desc');
        } catch (error) {
            console.error('Error counting pending tests by service:', error);
            throw new Error('Unable to count pending tests by service');
        }
    }
}; 