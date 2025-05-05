import db from '../ultis/db.js';

export default {
    async findAll() {
        try {
            // Find all schedules with doctor info
            const doctorSchedules = await db('Schedule')
                .where('Schedule.doctorId', '!=', null)
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName',
                    'Room.roomNumber',
                    db.raw('\'doctor\' as staffType')
                );
                
            let labtechSchedules = [];
            
            // Check if labTechnicianId column exists
            try {
                // Try to get schedules with lab technician info
                labtechSchedules = await db('Schedule')
                    .whereNotNull('Schedule.labTechnicianId')
                    .join('LabTechnician', 'Schedule.labTechnicianId', '=', 'LabTechnician.technicianId')
                    .join('User', 'LabTechnician.userId', '=', 'User.userId')
                    .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                    .select(
                        'Schedule.*',
                        'User.fullName as labTechnicianName',
                        'Room.roomNumber',
                        db.raw('\'labTechnician\' as staffType')
                    );
            } catch (error) {
                // If error occurs, it likely means the column doesn't exist yet
                console.log("Could not fetch lab technician schedules, labTechnicianId might not exist:", error.message);
            }
                
            // Combine and sort by date and time
            return [...doctorSchedules, ...labtechSchedules]
                .sort((a, b) => {
                    if (a.workDate !== b.workDate) {
                        return a.workDate > b.workDate ? 1 : -1;
                    }
                    return a.startTime > b.startTime ? 1 : -1;
                });
        } catch (error) {
            console.error('Error fetching schedules:', error);
            throw new Error('Unable to load schedules');
        }
    },

    async findById(scheduleId) {
        try {
            // Find schedule by ID
            const schedule = await db('Schedule')
                .where('Schedule.scheduleId', scheduleId)
                .first();
                
            if (!schedule) {
                return null;
            }
            
            // Add staff details based on whether it's a doctor
            if (schedule.doctorId) {
                const doctorDetails = await db('Doctor')
                    .join('User', 'Doctor.userId', '=', 'User.userId')
                    .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                    .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                    .select(
                        'User.fullName as doctorName',
                        'User.email',
                        'User.phoneNumber',
                        'Doctor.experience',
                        'Doctor.licenseNumber',
                        'Specialty.name as specialtyName',
                        'Room.roomNumber',
                        'Room.name as roomName'
                    )
                    .where('Doctor.doctorId', schedule.doctorId)
                    .first();
                    
                return { ...schedule, ...doctorDetails, staffType: 'doctor' };
            }
            
            // Check if labTechnicianId exists in the schedule
            if (schedule.hasOwnProperty('labTechnicianId') && schedule.labTechnicianId) {
                try {
                    const labtechDetails = await db('LabTechnician')
                        .join('User', 'LabTechnician.userId', '=', 'User.userId')
                        .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                        .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                        .select(
                            'User.fullName as labTechnicianName',
                            'User.email',
                            'User.phoneNumber',
                            'LabTechnician.specialization',
                            'Specialty.name as specialtyName',
                            'Room.roomNumber',
                            'Room.name as roomName'
                        )
                        .where('LabTechnician.technicianId', schedule.labTechnicianId)
                        .first();
                        
                    return { ...schedule, ...labtechDetails, staffType: 'labTechnician' };
                } catch (error) {
                    console.log("Error fetching lab technician details:", error.message);
                }
            }
            
            return schedule;
        } catch (error) {
            console.error(`Error fetching schedule with ID ${scheduleId}:`, error);
            throw new Error('Unable to find schedule');
        }
    },

    async findByDoctor(doctorId) {
        try {
            return await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber'
                )
                .where('Schedule.doctorId', doctorId)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to find schedules by doctor');
        }
    },

    async findByRoom(roomId) {
        try {
            return await db('Schedule')
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName'
                )
                .where('Schedule.roomId', roomId)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for room ID ${roomId}:`, error);
            throw new Error('Unable to find schedules by room');
        }
    },

    async findByDateRange(startDate, endDate) {
        try {
            console.log(`Finding schedules between ${startDate} and ${endDate}`);
            
            // Find all schedules with doctor info
            const doctorSchedules = await db('Schedule')
                .whereNotNull('Schedule.doctorId')
                .whereBetween('Schedule.workDate', [startDate, endDate])
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName',
                    'Room.roomNumber',
                    'Specialty.name as specialtyName',
                    'Specialty.specialtyId',
                    db.raw('\'doctor\' as staffType')
                );
            
            console.log(`Found ${doctorSchedules.length} doctor schedules`);
                
            let labtechSchedules = [];
            
            // Check if labTechnicianId column exists
            try {
                // Try to get schedules with lab technician info
                labtechSchedules = await db('Schedule')
                    .whereNotNull('Schedule.labTechnicianId')
                    .whereBetween('Schedule.workDate', [startDate, endDate])
                    .join('LabTechnician', 'Schedule.labTechnicianId', '=', 'LabTechnician.technicianId')
                    .join('User', 'LabTechnician.userId', '=', 'User.userId')
                    .join('Specialty', 'LabTechnician.specialtyId', '=', 'Specialty.specialtyId')
                    .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                    .select(
                        'Schedule.*',
                        'User.fullName as labTechnicianName',
                        'Room.roomNumber',
                        'Specialty.name as specialtyName',
                        'Specialty.specialtyId',
                        db.raw('\'labTechnician\' as staffType')
                    );
                    
                console.log(`Found ${labtechSchedules.length} lab technician schedules`);
            } catch (error) {
                // If error occurs, it likely means the column doesn't exist yet
                console.log("Could not fetch lab technician schedules, labTechnicianId might not exist:", error.message);
            }
            
            // Make sure all schedules have the proper data types for filtering
            doctorSchedules.forEach(schedule => {
                schedule.specialtyId = parseInt(schedule.specialtyId);
                schedule.doctorId = parseInt(schedule.doctorId);
                if (schedule.roomId) schedule.roomId = parseInt(schedule.roomId);
            });
            
            labtechSchedules.forEach(schedule => {
                schedule.specialtyId = parseInt(schedule.specialtyId);
                schedule.labTechnicianId = parseInt(schedule.labTechnicianId);
                if (schedule.roomId) schedule.roomId = parseInt(schedule.roomId);
            });
                
            // Combine and sort by date and time
            const allSchedules = [...doctorSchedules, ...labtechSchedules]
                .sort((a, b) => {
                    if (a.workDate !== b.workDate) {
                        return a.workDate > b.workDate ? 1 : -1;
                    }
                    return a.startTime > b.startTime ? 1 : -1;
                });
                
            console.log(`Returning ${allSchedules.length} total schedules`);
            if (allSchedules.length > 0) {
                // Log a sample of each type to verify structure
                const doctorSample = allSchedules.find(s => s.staffType === 'doctor');
                const labtechSample = allSchedules.find(s => s.staffType === 'labTechnician');
                
                if (doctorSample) {
                    console.log('Sample doctor schedule structure:', {
                        scheduleId: doctorSample.scheduleId,
                        doctorId: doctorSample.doctorId,
                        staffType: doctorSample.staffType,
                        specialtyId: doctorSample.specialtyId,
                        specialtyName: doctorSample.specialtyName
                    });
                }
                
                if (labtechSample) {
                    console.log('Sample labtech schedule structure:', {
                        scheduleId: labtechSample.scheduleId,
                        labTechnicianId: labtechSample.labTechnicianId,
                        staffType: labtechSample.staffType,
                        specialtyId: labtechSample.specialtyId,
                        specialtyName: labtechSample.specialtyName
                    });
                }
            }
            
            return allSchedules;
        } catch (error) {
            console.error(`Error fetching schedules between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to find schedules by date range');
        }
    },

    async findByStatus(status) {
        try {
            return await db('Schedule')
                .join('Doctor', 'Schedule.doctorId', '=', 'Doctor.doctorId')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'User.fullName as doctorName',
                    'Room.roomNumber'
                )
                .where('Schedule.status', status)
                .orderBy('Schedule.workDate')
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules with status ${status}:`, error);
            throw new Error('Unable to find schedules by status');
        }
    },

    async findByDoctorAndDate(doctorId, date) {
        try {
            return await db('Schedule')
                .leftJoin('Room', 'Schedule.roomId', '=', 'Room.roomId')
                .select(
                    'Schedule.*',
                    'Room.roomNumber'
                )
                .where({
                    'Schedule.doctorId': doctorId,
                    'Schedule.workDate': date
                })
                .orderBy('Schedule.startTime');
        } catch (error) {
            console.error(`Error fetching schedules for doctor ID ${doctorId} on date ${date}:`, error);
            throw new Error('Unable to find schedules by doctor and date');
        }
    },

    async add(schedule) {
        try {
            const [scheduleId] = await db('Schedule').insert(schedule);
            return scheduleId;
        } catch (error) {
            console.error('Error adding schedule:', error);
            throw new Error('Unable to add schedule');
        }
    },

    async bulkAdd(schedules) {
        try {
            // Batch insert multiple schedules
            const result = await db('Schedule').insert(schedules);
            return result;
        } catch (error) {
            console.error('Error adding multiple schedules:', error);
            throw new Error('Unable to add schedules in bulk');
        }
    },

    async update(scheduleId, schedule) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .update(schedule);
            return result > 0;
        } catch (error) {
            console.error(`Error updating schedule with ID ${scheduleId}:`, error);
            throw new Error('Unable to update schedule');
        }
    },

    async updateStatus(scheduleId, status) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .update({ status });
            return result > 0;
        } catch (error) {
            console.error(`Error updating status for schedule with ID ${scheduleId}:`, error);
            throw new Error('Unable to update schedule status');
        }
    },

    async delete(scheduleId) {
        try {
            const result = await db('Schedule')
                .where('scheduleId', scheduleId)
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting schedule with ID ${scheduleId}:`, error);
            throw new Error('Unable to delete schedule');
        }
    },

    async deleteByDoctorAndDateRange(doctorId, startDate, endDate) {
        try {
            const result = await db('Schedule')
                .where('doctorId', doctorId)
                .whereBetween('workDate', [startDate, endDate])
                .delete();
            return result > 0;
        } catch (error) {
            console.error(`Error deleting schedules for doctor ID ${doctorId} between ${startDate} and ${endDate}:`, error);
            throw new Error('Unable to delete schedules by date range');
        }
    },

    async countByStatus() {
        try {
            return await db('Schedule')
                .select('status')
                .count('scheduleId as count')
                .groupBy('status');
        } catch (error) {
            console.error('Error counting schedules by status:', error);
            throw new Error('Unable to count schedules by status');
        }
    },

    async getDoctorAvailabilityByDate(date) {
        try {
            // Get all doctors with their schedules for the given date
            return await db('Doctor')
                .join('User', 'Doctor.userId', '=', 'User.userId')
                .join('Specialty', 'Doctor.specialtyId', '=', 'Specialty.specialtyId')
                .leftJoin('Schedule', function() {
                    this.on('Doctor.doctorId', '=', 'Schedule.doctorId')
                        .andOn('Schedule.workDate', '=', db.raw('?', [date]));
                })
                .select(
                    'Doctor.doctorId',
                    'User.fullName',
                    'Specialty.name as specialtyName',
                    'Specialty.specialtyId',
                    db.raw(`GROUP_CONCAT(
                        CASE 
                            WHEN Schedule.scheduleId IS NOT NULL 
                            THEN CONCAT(
                                Schedule.scheduleId, '|',
                                Schedule.startTime, '|', 
                                Schedule.endTime, '|',
                                Schedule.status
                            )
                            ELSE NULL
                        END
                        SEPARATOR ';'
                    ) as timeSlots`)
                )
                .where('User.accountStatus', 'active')
                .groupBy('Doctor.doctorId')
                .orderBy('User.fullName');
        } catch (error) {
            console.error(`Error getting doctor availability for date ${date}:`, error);
            throw new Error('Unable to get doctor availability');
        }
    },

    async generateWorkSchedule(doctorId, startDate, endDate, workingDays, startTime, endTime, slotDuration, roomId = null) {
        try {
            // Convert working days to array if string (e.g., "1,2,3,4,5")
            if (typeof workingDays === 'string') {
                workingDays = workingDays.split(',').map(day => parseInt(day.trim()));
            }
            
            const schedules = [];
            const currentDate = new Date(startDate);
            const lastDate = new Date(endDate);
            
            // Create schedule entries for each day in the range
            while (currentDate <= lastDate) {
                // Check if current day is in working days (0 = Sunday, 1 = Monday, etc.)
                if (workingDays.includes(currentDate.getDay())) {
                    let currentTime = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate(),
                        parseInt(startTime.split(':')[0]),
                        parseInt(startTime.split(':')[1])
                    );
                    
                    const endTimeObj = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate(),
                        parseInt(endTime.split(':')[0]),
                        parseInt(endTime.split(':')[1])
                    );
                    
                    // Create slots until end time
                    while (currentTime < endTimeObj) {
                        const slotEndTime = new Date(currentTime);
                        slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDuration);
                        
                        // Don't add if slot exceeds end time
                        if (slotEndTime <= endTimeObj) {
                            schedules.push({
                                doctorId,
                                roomId,
                                workDate: currentDate.toISOString().split('T')[0],
                                startTime: currentTime.toTimeString().substring(0, 5),
                                endTime: slotEndTime.toTimeString().substring(0, 5),
                                status: 'available'
                            });
                        }
                        
                        // Move to next slot
                        currentTime = slotEndTime;
                    }
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Insert all schedules if any were created
            if (schedules.length > 0) {
                await this.bulkAdd(schedules);
            }
            
            return schedules.length;
        } catch (error) {
            console.error(`Error generating work schedule for doctor ID ${doctorId}:`, error);
            throw new Error('Unable to generate work schedule');
        }
    }
}; 