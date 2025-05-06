import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage', // Explicitly select profileImage
                    'Specialty.name as specialtyName'
                );
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw new Error('Unable to load doctors');
        }
    },

    async findById(doctorId) {
        try {
            const doctor = await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage', // Explicitly select profileImage
                    'Specialty.name as specialtyName'
                )
                .where('Doctor.doctorId', doctorId)
                .first();
            return doctor || null;
        } catch (error) {
            console.error(`Error fetching doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to find doctor');
        }
    },

    async findByUserId(userId) {
        try {
            const doctor = await db('Doctor')
                .where('userId', userId)
                .first();
            return doctor || null;
        } catch (error) {
            console.error(`Error fetching doctor with user ID ${userId}:`, error);
            throw new Error('Unable to find doctor');
        }
    },

    async findBySpecialty(specialtyId) {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'User.profileImage', // Explicitly select profileImage
                    'Specialty.name as specialtyName'
                )
                .where('Doctor.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active');
        } catch (error) {
            console.error(`Error fetching doctors by specialty ID ${specialtyId}:`, error);
            throw new Error('Unable to find doctors by specialty');
        }
    },

    async search(query) {
        try {
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select(
                    'Doctor.*',
                    'User.email',
                    'User.fullName',
                    'User.phoneNumber',
                    'User.address',
                    'User.accountStatus',
                    'User.gender',
                    'User.dob',
                    'Specialty.name as specialtyName'
                )
                .where('User.fullName', 'like', `%${query}%`)
                .orWhere('User.email', 'like', `%${query}%`)
                .orWhere('Doctor.licenseNumber', 'like', `%${query}%`)
                .orWhere('Specialty.name', 'like', `%${query}%`);
        } catch (error) {
            console.error(`Error searching doctors with query "${query}":`, error);
            throw new Error('Unable to search doctors');
        }
    },

    async add(doctor) {
        try {
            // Chỉ lấy các trường phù hợp với bảng Doctor
            const doctorData = {
                userId: doctor.userId,
                specialtyId: doctor.specialtyId,
                licenseNumber: doctor.licenseNumber || 'N/A',
                experience: doctor.experience || 0,
                education: doctor.education || null,
                certifications: doctor.certifications || null,
                bio: doctor.bio || null
            };

            const [doctorId] = await db('Doctor').insert(doctorData);
            return doctorId;
        } catch (error) {
            console.error('Error adding doctor:', error);
            throw new Error('Unable to add doctor');
        }
    },

    async update(doctorId, doctor) {
        try {
            // Tách dữ liệu bác sĩ và người dùng
            const doctorData = {};
            const userData = {};

            // Cập nhật thông tin bác sĩ
            if (doctor.specialtyId) doctorData.specialtyId = doctor.specialtyId;
            if (doctor.licenseNumber) doctorData.licenseNumber = doctor.licenseNumber;
            if (doctor.experience) doctorData.experience = doctor.experience;
            if (doctor.education) doctorData.education = doctor.education;
            if (doctor.certifications) doctorData.certifications = doctor.certifications;
            if (doctor.bio) doctorData.bio = doctor.bio;

            // Cập nhật thông tin user nếu có
            if (doctor.fullName) userData.fullName = doctor.fullName;
            if (doctor.email) userData.email = doctor.email;
            if (doctor.phoneNumber) userData.phoneNumber = doctor.phoneNumber;
            if (doctor.address) userData.address = doctor.address;
            if (doctor.gender) userData.gender = doctor.gender;
            if (doctor.dob) userData.dob = doctor.dob;
            if (doctor.accountStatus) userData.accountStatus = doctor.accountStatus;

            // Cập nhật bảng Doctor
            let result = 0;
            if (Object.keys(doctorData).length > 0) {
                result = await db('Doctor')
                    .where('doctorId', doctorId)
                    .update(doctorData);
            }

            // Cập nhật bảng User nếu cần
            if (Object.keys(userData).length > 0) {
                const doctorRecord = await this.findById(doctorId);
                if (doctorRecord && doctorRecord.userId) {
                    await db('User')
                        .where('userId', doctorRecord.userId)
                        .update(userData);
                    // Đảm bảo trả về true nếu chỉ cập nhật userData
                    result = result || 1;
                }
            }

            return result > 0;
        } catch (error) {
            console.error(`Error updating doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to update doctor');
        }
    },

    async updateByUserId(userId, doctor) {
        try {
            // First, find the doctor record by userId
            const doctorRecord = await db('Doctor')
                .where('userId', userId)
                .first();

            if (!doctorRecord) {
                throw new Error(`Doctor with user ID ${userId} not found`);
            }

            // Now update using the doctorId
            const doctorId = doctorRecord.doctorId;

            // Create doctor data object with only the fields that belong to the Doctor table
            const doctorData = {};
            if (doctor.specialtyId) doctorData.specialtyId = doctor.specialtyId;
            if (doctor.licenseNumber) doctorData.licenseNumber = doctor.licenseNumber;
            if (doctor.experience) doctorData.experience = doctor.experience;
            if (doctor.education) doctorData.education = doctor.education;
            if (doctor.certifications) doctorData.certifications = doctor.certifications;
            if (doctor.bio) doctorData.bio = doctor.bio;

            // Only update if there are fields to update
            if (Object.keys(doctorData).length > 0) {
                const result = await db('Doctor')
                    .where('doctorId', doctorId)
                    .update(doctorData);

                return result > 0;
            }

            // If no fields to update, consider it a success
            return true;
        } catch (error) {
            console.error(`Error updating doctor with user ID ${userId}:`, error);
            throw new Error('Unable to update doctor: ' + error.message);
        }
    },

    async delete(doctorId) {
        try {
            const result = await db('Doctor')
                .where('doctorId', doctorId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting doctor with ID ${doctorId}:`, error);
            throw new Error('Unable to delete doctor');
        }
    },

    async countBySpecialty() {
        try {
            return await db('Doctor')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .select('Specialty.name')
                .count('Doctor.doctorId as count')
                .groupBy('Doctor.specialtyId');
        } catch (error) {
            console.error('Error counting doctors by specialty:', error);
            throw new Error('Unable to count doctors by specialty');
        }
    },

    async countByExperience() {
        try {
            return await db.raw(`
                SELECT
                    CASE
                        WHEN experience < 5 THEN 'Less than 5 years'
                        WHEN experience BETWEEN 5 AND 10 THEN '5-10 years'
                        WHEN experience BETWEEN 11 AND 20 THEN '11-20 years'
                        ELSE 'More than 20 years'
                    END AS experience_range,
                    COUNT(*) as count
                FROM Doctor
                GROUP BY experience_range
                ORDER BY
                    CASE experience_range
                        WHEN 'Less than 5 years' THEN 1
                        WHEN '5-10 years' THEN 2
                        WHEN '11-20 years' THEN 3
                        WHEN 'More than 20 years' THEN 4
                    END
            `);
        } catch (error) {
            console.error('Error counting doctors by experience range:', error);
            throw new Error('Unable to count doctors by experience range');
        }
    },

    async getDoctorWithSchedule(doctorId, startDate, endDate) {
        try {
            // Get doctor details
            const doctor = await this.findById(doctorId);

            if (!doctor) return null;

            // Get schedule for date range
            const schedules = await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber',
                    'Room.roomType'
                )
                .where('Schedule.doctorId', doctorId)
                .andWhere('Schedule.workDate', '>=', startDate)
                .andWhere('Schedule.workDate', '<=', endDate)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');

            // Return doctor with schedules
            return {
                ...doctor,
                schedules
            };
        } catch (error) {
            console.error(`Error fetching doctor with schedule for ID ${doctorId}:`, error);
            throw new Error('Unable to get doctor with schedule');
        }
    },

    async getDoctorWithAppointments(doctorId, date) {
        try {
            // Get doctor details
            const doctor = await this.findById(doctorId);

            if (!doctor) return null;

            // Get appointments for specific date
            const appointments = await db('Appointment')
                .join('Patient', 'Appointment.patientId', '=', 'Patient.patientId')
                .join('User', 'Patient.userId', '=', 'User.userId')
                .leftJoin('Room', 'Appointment.roomId', '=', 'Room.roomId')
                .select(
                    'Appointment.*',
                    'User.fullName as patientName',
                    'User.phoneNumber',
                    'User.gender',
                    'User.dob',
                    'Room.roomNumber'
                )
                .where('Appointment.doctorId', doctorId)
                .andWhere('Appointment.appointmentDate', date)
                .orderBy('Appointment.estimatedTime');

            // Return doctor with appointments
            return {
                ...doctor,
                appointments
            };
        } catch (error) {
            console.error(`Error fetching doctor with appointments for ID ${doctorId} on date ${date}:`, error);
            throw new Error('Unable to get doctor with appointments');
        }
    },

    async getAvailableDoctors(specialtyId, date) {
        try {
            // Find doctors in the specialty with available schedules on the specified date
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .join('Schedule', 'Doctor.doctorId', '=', 'Schedule.doctorId')
                .select(
                    'Doctor.*',
                    'User.fullName',
                    'User.gender',
                    'User.dob',
                    'Specialty.name as specialtyName',
                    'Schedule.startTime',
                    'Schedule.endTime',
                    'Schedule.scheduleId'
                )
                .where('Doctor.specialtyId', specialtyId)
                .andWhere('User.accountStatus', 'active')
                .andWhere('Schedule.workDate', date)
                .andWhere('Schedule.status', 'available')
                .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error fetching available doctors for specialty ${specialtyId} on date ${date}:`, error);
            throw new Error('Unable to find available doctors');
        }
    }
};