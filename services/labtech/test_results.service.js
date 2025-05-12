import db from '../../ultis/db.js';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to build the query with filters
const buildQuery = (query, filters) => {
    if (filters.search) {
        query.where(function() {
            this.where('Patient.fullName', 'like', `%${filters.search}%`)
                .orWhere('Patient.patientId', 'like', `%${filters.search}%`);
        });
    }
    
    if (filters.testType) {
        query.where('Service.serviceId', filters.testType);
    }
    
    if (filters.resultType === 'normal') {
        query.where(function() {
            this.whereNull('TestResult.isAbnormal')
                .orWhere('TestResult.isAbnormal', false);
        });
    } else if (filters.resultType === 'abnormal') {
        query.where('TestResult.isAbnormal', true);
    }
    
    if (filters.dateFrom) {
        query.where('TestResult.performedDate', '>=', filters.dateFrom);
    }
    
    if (filters.dateTo) {
        query.where('TestResult.performedDate', '<=', filters.dateTo);
    }
    
    return query;
};

export default {
    /**
     * Get paginated list of test results with filters
     */
    async getTestResults({ page = 1, limit = 10, search = '', testType = '', resultType = '', dateFrom = '', dateTo = '' }) {
        try {
            const filters = { search, testType, resultType, dateFrom, dateTo };
            
            // Build query
            let query = db('TestResult')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .join('User', 'LabTechnician.userId', 'User.userId')
                .leftJoin('Room', 'TestResult.roomId', 'Room.roomId')
                .select(
                    'TestResult.*',
                    'Service.name as testName',
                    'Service.description as testDescription',
                    'Patient.fullName as patientName',
                    'Patient.patientId',
                    'Room.roomNumber'
                );
            
            // Apply filters
            query = buildQuery(query, filters);
            
            // Get total count for pagination
            const countQuery = db('TestResult')
                .count('TestResult.resultId as count')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId');
            
            // Apply filters to count query
            buildQuery(countQuery, filters);
            
            const totalResults = await countQuery.first();
            
            // Get paginated results
            const offset = (page - 1) * limit;
            const results = await query
                .orderBy('TestResult.performedDate', 'desc')
                .limit(limit)
                .offset(offset);
            
            return {
                results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalResults ? parseInt(totalResults.count) : 0,
                    pages: totalResults ? Math.ceil(totalResults.count / limit) : 0
                }
            };
        } catch (error) {
            console.error('Error getting test results:', error);
            throw error;
        }
    },

    /**
     * Get test result by ID with all associated details
     */
    async getTestResultById(resultId) {
        try {
            const result = await db('TestResult')
                .join('TestRequest', 'TestResult.requestId', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .leftJoin('Room', 'TestResult.roomId', 'Room.roomId')
                .leftJoin('LabTechnician', 'TestResult.technicianId', 'LabTechnician.technicianId')
                .leftJoin('User as TechUser', 'LabTechnician.userId', 'TechUser.userId')
                .leftJoin('File', 'TestResult.resultFileId', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as testName',
                    'Service.description as testDescription',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender',
                    'Patient.dob as dateOfBirth',
                    'Room.roomNumber',
                    'Room.roomType',
                    'TechUser.fullName as technicianName',
                    'File.fileName',
                    'File.filePath',
                    'File.fileType'
                )
                .where('TestResult.resultId', resultId)
                .first();
            
            return result;
        } catch (error) {
            console.error(`Error getting test result with ID ${resultId}:`, error);
            throw error;
        }
    },

    /**
     * Update an existing test result
     */
    async updateTestResult(resultId, updateData, resultFile, userId) {
        try {
            // Start a transaction
            const trx = await db.transaction();
            
            try {
                // Handle file upload if present
                if (resultFile) {
                    // Upload file to database
                    const fileData = {
                        fileName: resultFile.originalname,
                        filePath: `/public/uploads/test_results/${resultFile.filename}`,
                        fileType: resultFile.mimetype,
                        fileSize: resultFile.size,
                        uploadDate: new Date(),
                        description: `Test result file for test #${resultId}`,
                        uploadedByUserId: userId
                    };
                    
                    // Insert file record
                    const [fileId] = await trx('File').insert(fileData);
                    
                    // Update the result with file ID
                    updateData.resultFileId = fileId;
                    updateData.resultType = 'file';
                }
                
                // Update status to completed if we're adding results
                if (updateData.performedDate || updateData.resultNumeric || updateData.resultText || updateData.resultFileId) {
                    updateData.status = 'completed';
                    updateData.reportedDate = new Date();
                }
                
                // Update the test result in the database
                await trx('TestResult')
                    .where('resultId', resultId)
                    .update(updateData);
                
                // Commit the transaction
                await trx.commit();
                
                return true;
            } catch (error) {
                // Rollback on error
                await trx.rollback();
                throw error;
            }
        } catch (error) {
            console.error(`Error updating test result with ID ${resultId}:`, error);
            throw error;
        }
    },

    /**
     * Get test request details for a test result
     */
    async getTestRequest(requestId) {
        try {
            const request = await db('TestRequest')
                .join('Appointment', 'TestRequest.appointmentId', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', 'Patient.patientId')
                .join('User as PatientUser', 'Patient.userId', 'PatientUser.userId')
                .join('Service', 'TestRequest.serviceId', 'Service.serviceId')
                .join('Doctor', 'TestRequest.requestedByDoctorId', 'Doctor.doctorId')
                .join('User as DoctorUser', 'Doctor.userId', 'DoctorUser.userId')
                .select(
                    'TestRequest.*',
                    'Service.name as typeName',
                    'Service.description',
                    'PatientUser.fullName as patientName',
                    'Patient.patientId',
                    'Patient.gender',
                    'Patient.dob as dateOfBirth',
                    'DoctorUser.fullName as requestedByName'
                )
                .where('TestRequest.requestId', requestId)
                .first();
            
            return request;
        } catch (error) {
            console.error(`Error getting test request with ID ${requestId}:`, error);
            throw error;
        }
    },

    /**
     * Generate a printable view of the test result
     */
    async generatePrintableView(resultId) {
        try {
            // Get test result with all associated data
            const result = await this.getTestResultById(resultId);
            
            if (!result) {
                throw new Error('Test result not found');
            }
            
            // Get the test request details
            const request = await this.getTestRequest(result.requestId);
            
            // Combine data for the printable view
            return {
                result,
                request,
                hospital: {
                    name: 'EternalCare Hospital',
                    address: '123 Medical Avenue, City, 10001',
                    phone: '(123) 456-7890',
                    email: 'contact@eternalcare.com',
                    logo: '/public/images/hospital-logo.png'
                },
                printDate: moment().format('YYYY-MM-DD HH:mm:ss')
            };
        } catch (error) {
            console.error(`Error generating printable view for test result ${resultId}:`, error);
            throw error;
        }
    },

    /**
     * Get all test types for filtering
     */
    async getTestTypes() {
        try {
            const types = await db('Service')
                .select('serviceId as typeId', 'name as typeName')
                .where('type', 'test')
                .orderBy('name');
            
            return types;
        } catch (error) {
            console.error('Error getting test types:', error);
            throw error;
        }
    },

    /**
     * Get all lab rooms
     */
    async getLabRooms() {
        try {
            const rooms = await db('Room')
                .select('roomId', 'roomNumber', 'roomType')
                .where('roomType', 'laboratory')
                .orderBy('roomNumber');
            
            return rooms;
        } catch (error) {
            console.error('Error getting lab rooms:', error);
            throw error;
        }
    },
    
    async getAll(filters = {}, technicianId, page = 1, limit = 10) {
        try {
            // Trước tiên lấy thông tin về lab technician để biết chuyên khoa
            const labTechnician = await db('LabTechnician')
                .select('specialtyId')
                .where('technicianId', technicianId)
                .first();
                
            if (!labTechnician) {
                throw new Error('Lab technician not found');
            }

            const specialtyId = labTechnician.specialtyId;
            
            // Create base query
            let query = db('TestResult')
                .join('TestRequest', 'TestResult.requestId', '=', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .leftJoin('Room', 'TestResult.roomId', '=', 'Room.roomId')
                .leftJoin('File', 'TestResult.resultFileId', '=', 'File.fileId')
                .select(
                    'TestResult.*',
                    'Service.name as testName',
                    'User.fullName',
                    'Patient.patientId',
                    'Room.roomNumber',
                    'File.fileName',
                    'File.filePath'
                )
                .where(function() {
                    // Lấy các xét nghiệm được gán cho lab technician này
                    // HOẶC là các xét nghiệm thuộc về chuyên khoa của lab technician này
                    this.where('TestResult.technicianId', technicianId)
                        .orWhereExists(function() {
                            this.select(db.raw(1))
                                .from('Service')
                                .whereRaw('Service.serviceId = TestRequest.serviceId')
                                .andWhere('Service.specialtyId', specialtyId);
                        });
                });
            
            // Apply filters
            if (filters.search) {
                query.where(function() {
                    this.where('User.fullName', 'like', `%${filters.search}%`)
                        .orWhere('Patient.patientId', 'like', `%${filters.search}%`);
                });
            }
            
            if (filters.testType) {
                query.where('Service.serviceId', filters.testType);
            }
            
            if (filters.resultType) {
                if (filters.resultType === 'abnormal') {
                    query.where('TestResult.isAbnormal', true);
                } else if (filters.resultType === 'normal') {
                    query.where(function() {
                        this.whereNull('TestResult.isAbnormal')
                            .orWhere('TestResult.isAbnormal', false);
                    });
                }
            }
            
            if (filters.dateFrom) {
                query.where('TestResult.performedDate', '>=', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                query.where('TestResult.performedDate', '<=', filters.dateTo);
            }
            
            // Create count query for pagination
            let countQuery = db('TestResult')
                .count('* as total')
                .join('TestRequest', 'TestResult.requestId', '=', 'TestRequest.requestId')
                .join('Appointment', 'TestRequest.appointmentId', '=', 'Appointment.appointmentId')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .join('Service', 'TestRequest.serviceId', '=', 'Service.serviceId')
                .where(function() {
                    // Lấy các xét nghiệm được gán cho lab technician này
                    // HOẶC là các xét nghiệm thuộc về chuyên khoa của lab technician này
                    this.where('TestResult.technicianId', technicianId)
                        .orWhereExists(function() {
                            this.select(db.raw(1))
                                .from('Service')
                                .whereRaw('Service.serviceId = TestRequest.serviceId')
                                .andWhere('Service.specialtyId', specialtyId);
                        });
                });
            
            // Apply the same filters to count query
            if (filters.search) {
                countQuery.where(function() {
                    this.where('User.fullName', 'like', `%${filters.search}%`)
                        .orWhere('Patient.patientId', 'like', `%${filters.search}%`);
                });
            }
            
            if (filters.testType) {
                countQuery.where('Service.serviceId', filters.testType);
            }
            
            if (filters.resultType) {
                if (filters.resultType === 'abnormal') {
                    countQuery.where('TestResult.isAbnormal', true);
                } else if (filters.resultType === 'normal') {
                    countQuery.where(function() {
                        this.whereNull('TestResult.isAbnormal')
                            .orWhere('TestResult.isAbnormal', false);
                    });
                }
            }
            
            if (filters.dateFrom) {
                countQuery.where('TestResult.performedDate', '>=', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                countQuery.where('TestResult.performedDate', '<=', filters.dateTo);
            }
            
            // Get total count
            const totalCount = await countQuery.first();
            const total = totalCount ? totalCount.total : 0;
            
            // Add pagination
            const offset = (page - 1) * limit;
            query = query
                .orderBy('TestResult.reportedDate', 'desc')
                .limit(limit)
                .offset(offset);
            
            // Execute query
            const testResults = await query;
            
            // Process results to ensure numeric values are checked for abnormality
            for (let result of testResults) {
                if (result.resultType === 'numeric' && result.normalRange && result.resultNumeric !== null) {
                    const [min, max] = result.normalRange.split('-').map(v => parseFloat(v.trim()));
                    result.isAbnormal = result.resultNumeric < min || result.resultNumeric > max;
                }
            }
            
            // Calculate pagination info
            const pagination = {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1
            };
            
            return { testResults, pagination, total };
        } catch (error) {
            console.error('Error getting test results:', error);
            throw new Error('Failed to load test results');
        }
    },

    /**
     * Check if lab technician has an active schedule at the current time
     * @param {number} technicianId - The ID of the lab technician
     * @returns {boolean} True if technician has active schedule, false otherwise
     */
    async hasActiveSchedule(technicianId) {
        try {
            const now = new Date();
            const currentDate = moment(now).format('YYYY-MM-DD');
            const currentTime = moment(now).format('HH:mm:ss');
            
            // Check if there's an active schedule for the technician at the current time
            const activeSchedule = await db('Schedule')
                .where('labTechnicianId', technicianId)
                .where('workDate', currentDate)
                .where('startTime', '<=', currentTime)
                .where('endTime', '>=', currentTime)
                .where('status', 'available') // Only consider available schedules
                .first();
            return true;
            return !!activeSchedule; // Return true if active schedule exists, false otherwise
        } catch (error) {
            console.error('Error checking active schedule:', error);
            throw new Error('Failed to check active schedule');
        }
    },
    async getTestTypesBySpecialty(id) {
        try {
            return await db('Service')
                .select('serviceId', 'name')
                .where('type', 'test')
                .where('specialtyId', id)
                .orderBy('name');
        } catch (error) {
            console.error('Error getting test types:', error);
            throw new Error('Failed to load test types');
        }
    }

}; 