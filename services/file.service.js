import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('File')
                .orderBy('uploadDate', 'desc');
        } catch (error) {
            console.error('Error fetching files:', error);
            throw new Error('Unable to load files');
        }
    },

    async findById(fileId) {
        try {
            const file = await db('File')
                .where('fileId', fileId)
                .first();
            return file || null;
        } catch (error) {
            console.error(`Error fetching file with ID ${fileId}:`, error);
            throw new Error('Unable to find file');
        }
    },

    async findByType(fileType) {
        try {
            return await db('File')
                .where('fileType', fileType)
                .orderBy('uploadDate', 'desc');
        } catch (error) {
            console.error(`Error fetching files with type ${fileType}:`, error);
            throw new Error('Unable to find files by type');
        }
    },

    async findByName(fileName) {
        try {
            return await db('File')
                .where('fileName', 'like', `%${fileName}%`)
                .orderBy('uploadDate', 'desc');
        } catch (error) {
            console.error(`Error fetching files with name like ${fileName}:`, error);
            throw new Error('Unable to find files by name');
        }
    },

    async findByTestResult() {
        try {
            return await db('File')
                .join('TestResult', 'File.fileId', '=', 'TestResult.resultFileId')
                .join('MedicalRecord', 'TestResult.recordId', '=', 'MedicalRecord.recordId')
                .join('Appointment', 'MedicalRecord.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Service', 'TestResult.serviceId', '=', 'Service.serviceId')
                .select(
                    'File.*',
                    'User.fullName as patientName',
                    'Service.name as serviceName',
                    'TestResult.resultId',
                    'TestResult.performedDate'
                )
                .orderBy('File.uploadDate', 'desc');
        } catch (error) {
            console.error('Error fetching files associated with test results:', error);
            throw new Error('Unable to find files by test results');
        }
    },

    async add(file) {
        try {
            const [fileId] = await db('File').insert(file);
            return fileId;
        } catch (error) {
            console.error('Error adding file:', error);
            throw new Error('Unable to add file');
        }
    },

    async update(fileId, file) {
        try {
            const result = await db('File')
                .where('fileId', fileId)
                .update(file);
            return result > 0;
        } catch (error) {
            console.error(`Error updating file with ID ${fileId}:`, error);
            throw new Error('Unable to update file');
        }
    },

    async delete(fileId) {
        try {
            // Check if file is referenced in TestResult
            const testResults = await db('TestResult')
                .where('resultFileId', fileId)
                .count('resultId as count')
                .first();
            
            if (testResults && testResults.count > 0) {
                throw new Error('Cannot delete file that is referenced in test results');
            }
            
            const result = await db('File')
                .where('fileId', fileId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting file with ID ${fileId}:`, error);
            throw new Error(error.message || 'Unable to delete file');
        }
    },

    async countByType() {
        try {
            return await db('File')
                .select('fileType')
                .count('fileId as count')
                .groupBy('fileType');
        } catch (error) {
            console.error('Error counting files by type:', error);
            throw new Error('Unable to count files by type');
        }
    },

    async getTotalStorage() {
        try {
            const [result] = await db('File')
                .sum('fileSize as totalSize');
            // Convert to megabytes
            return {
                bytes: result.totalSize || 0,
                megabytes: ((result.totalSize || 0) / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('Error calculating total storage usage:', error);
            throw new Error('Unable to calculate total storage usage');
        }
    },

    async getMonthlyUploadCounts(months = 12) {
        try {
            // Get upload counts by month for the past N months
            return await db.raw(`
                SELECT 
                    DATE_FORMAT(uploadDate, '%Y-%m') as month,
                    COUNT(fileId) as fileCount,
                    SUM(fileSize) as totalSize
                FROM File
                WHERE uploadDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
                GROUP BY month
                ORDER BY month
            `, [months]);
        } catch (error) {
            console.error(`Error fetching monthly upload counts for past ${months} months:`, error);
            throw new Error('Unable to get monthly upload counts');
        }
    }
}; 