import express from 'express';
import moment from 'moment';
import db from '../../ultis/db.js';
import Room from '../../models/Room.js';
import Doctor from '../../models/Doctor.js';
import Specialty from '../../models/Specialty.js';
import Schedule from '../../models/Schedule.js';
import LabTechnician from '../../models/LabTechnician.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'schedule'; // Set current route highlight
    next();
});

// GET: Display the work schedule dashboard/overview
router.get('/', async function (req, res) {
    try {
        // Get selected date range (default to current week)
        const startDate = req.query.startDate || moment().startOf('week').format('YYYY-MM-DD');
        const endDate = req.query.endDate || moment(startDate).add(6, 'days').format('YYYY-MM-DD');
        
        // Get selected specialty (optional filter)
        const specialtyId = req.query.specialty ? parseInt(req.query.specialty) : null;
        
        // Get selected doctor (optional filter)
        const doctorId = req.query.doctorId ? parseInt(req.query.doctorId) : null;
        
        // Get selected staff type filter (optional)
        const staffTypeFilter = req.query.staffType || 'all'; // 'all', 'doctor', or 'labTechnician'
        
        console.log('Filters applied:', { 
            startDate, 
            endDate, 
            specialtyId: specialtyId || 'None', 
            doctorId: doctorId || 'None',
            staffTypeFilter
        });
        
        // Get all specialties for filter dropdown
        const specialties = await Specialty.findAll();
        
        // Get all schedules for the selected date range (unfiltered)
        let schedules = await Schedule.findByDateRange(startDate, endDate);
            
        console.log(`Total schedules: ${schedules.length}`);
        
        console.log('Schedule types:', schedules.map(s => s.staffType).filter((v, i, a) => a.indexOf(v) === i));
        
        // Debug: log some sample schedules to see their structure
        if (schedules.length > 0) {
            console.log('Sample doctor schedule:', schedules.find(s => s.staffType === 'doctor'));
            console.log('Sample lab tech schedule:', schedules.find(s => s.staffType === 'labTechnician'));
        }
        
        // Format workDate as YYYY-MM-DD string for template comparison
        schedules.forEach(schedule => {
            schedule.originalWorkDate = schedule.workDate;
            schedule.workDate = moment(schedule.workDate).format('YYYY-MM-DD');
        });
        
        // Apply staff type filter if selected (not 'all')
        if (staffTypeFilter !== 'all') {
            console.log(`Filtering by staff type: ${staffTypeFilter}`);
            const beforeCount = schedules.length;
            schedules = schedules.filter(schedule => schedule.staffType === staffTypeFilter);
            console.log(`Schedules after staff type filter: ${schedules.length} (removed ${beforeCount - schedules.length})`);
        }
        
        // Apply specialty filter to schedules if selected
        if (specialtyId) {
            console.log(`Filtering by specialty ID: ${specialtyId}`);
            
            // Verify the specialtyId field exists and show debugging info
            schedules.forEach((s, i) => {
                if (i < 5) {
                    console.log(`Schedule ${i} staffType: ${s.staffType}, specialtyId: ${s.specialtyId}, 
                        labTechnicianId: ${s.labTechnicianId}, doctorId: ${s.doctorId},
                        doctorSpecialtyName: ${s.doctorSpecialtyName}, labSpecialtyName: ${s.labSpecialtyName}`);
                }
            });
            
            const beforeCount = schedules.length;
            
            // Get lab technicians by specialty for lookup
            const labTechnicians = await LabTechnician.findBySpecialty(specialtyId);
            const labTechIds = labTechnicians.map(tech => tech.technicianId);
            console.log(`Found ${labTechIds.length} lab technicians for specialty ID ${specialtyId}:`, labTechIds);
            
            // Try to find specialty name for given ID to match against name
            let targetSpecialtyName = '';
            const foundSpecialty = specialties.find(s => s.specialtyId === specialtyId);
            if (foundSpecialty) {
                targetSpecialtyName = foundSpecialty.name;
                console.log(`Target specialty name: ${targetSpecialtyName}`);
            }
            
            schedules = schedules.filter(schedule => {
                // For doctor schedules
                if (schedule.staffType === 'doctor') {
                    const doctorSpecialtyId = typeof schedule.specialtyId === 'string' 
                        ? parseInt(schedule.specialtyId) 
                        : schedule.specialtyId;
                    
                    return doctorSpecialtyId === specialtyId;
                } 
                // For lab technician schedules - use technicianId to match with labs in the correct specialty
                else if (schedule.staffType === 'labTechnician') {
                    // First try direct ID comparison if available
                    if (schedule.specialtyId !== null && schedule.specialtyId !== undefined) {
                        const techSpecialtyId = typeof schedule.specialtyId === 'string' 
                            ? parseInt(schedule.specialtyId) 
                            : schedule.specialtyId;
                        
                        if (techSpecialtyId === specialtyId) {
                            return true;
                        }
                    }
                    
                    // If ID comparison didn't work, try name matching
                    if (targetSpecialtyName && schedule.labSpecialtyName === targetSpecialtyName) {
                        return true;
                    }
                    
                    // If both above methods fail, check if the lab technician's ID is in our list
                    if (schedule.labTechnicianId && labTechIds.includes(schedule.labTechnicianId)) {
                        return true;
                    }
                    
                    return false;
                }
                
                return false;
            });
            console.log(`Schedules after specialty filter: ${schedules.length} (removed ${beforeCount - schedules.length})`);
        }
        
        // Apply doctor filter to schedules if selected
        if (doctorId) {
            console.log(`Filtering by doctor ID: ${doctorId}`);
            const beforeCount = schedules.length;
            schedules = schedules.filter(schedule => 
                (schedule.staffType === 'doctor' && schedule.doctorId === doctorId)
            );
            console.log(`Schedules after doctor filter: ${schedules.length} (removed ${beforeCount - schedules.length})`);
        }
        
        // Get doctors (filtered by specialty if selected)
        let doctors = [];
        if (specialtyId) {
            doctors = await Doctor.findBySpecialty(specialtyId);
            console.log(`Doctors for specialty ${specialtyId}: ${doctors.length}`);
        } else {
            doctors = await Doctor.findAll();
            console.log(`All doctors: ${doctors.length}`);
        }
        
        // Get lab technicians (filtered by specialty if selected)
        let labTechnicians = [];
        if (specialtyId) {
            labTechnicians = await LabTechnician.findBySpecialty(specialtyId);
            console.log(`Lab techs for specialty ${specialtyId}: ${labTechnicians.length}`);
        } else {
            labTechnicians = await LabTechnician.findAll();
            console.log(`All lab techs: ${labTechnicians.length}`);
        }
        
        // Get rooms (filtered by specialty if selected)
        let rooms = [];
        if (specialtyId) {
            rooms = await Room.findBySpecialty(specialtyId);
        } else {
            rooms = await Room.findAll();
        }
        
        // Generate calendar days
        const days = generateDayLabels(startDate, endDate);
        
        // Render the schedule view
        res.render('vwAdmin/schedule/index', {
            specialties,
            doctors,
            labTechnicians,
            rooms,
            schedules,
            startDate,
            endDate,
            specialtyId,
            doctorId,
            staffTypeFilter,
            days: days,
            timeSlots: generateTimeSlots()
        });
    } catch (error) {
        console.error('Error loading schedule dashboard:', error);
        res.render('vwAdmin/schedule/index', { 
            error: 'Failed to load schedule data: ' + error.message,
            specialties: [],
            doctors: [],
            labTechnicians: [],
            rooms: [],
            schedules: [],
            days: generateDayLabels(),
            timeSlots: generateTimeSlots()
        });
    }
});

// GET: Form to add a new schedule
router.get('/add', async function (req, res) {
    try {
        const specialties = await Specialty.findAll();
        const rooms = await Room.findAll();
        
        res.render('vwAdmin/schedule/add', {
            specialties,
            rooms
        });
    } catch (error) {
        console.error('Error loading add schedule form:', error);
        res.redirect('/admin/schedule');
    }
});

// POST: Add a new schedule
router.post('/add', async function (req, res) {
    try {
        console.log("Request body:", req.body);
        
        // Normalize and fix input values
        const staffType = req.body.staffType;
        const doctorId = staffType === 'doctor' ? req.body.doctorId : null;
        const labTechnicianId = staffType === 'labTechnician' ? req.body.staffId : null;
        const shift = req.body.shift;
        
        // Fix times based on shift
        let startTime = '07:00:00';
        let endTime = '11:30:00';
        if (shift === 'afternoon') {
            startTime = '13:00:00';
            endTime = '16:30:00';
        }
        
        // Normalize start date
        let startDate = req.body.startDate;
        if (Array.isArray(startDate)) {
            // If startDate is an array, use the non-empty value
            startDate = startDate.filter(d => d).pop();
        }
        
        const endDate = req.body.endDate;
        const workingDays = req.body.workingDays;
        const roomId = req.body.roomId;
        const status = req.body.status || 'available';
        const schedulePattern = req.body.schedulePattern;
        
        console.log("Normalized values:", {
            staffType,
            doctorId,
            labTechnicianId,
            startDate,
            endDate,
            startTime,
            endTime,
            workingDays,
            roomId,
            status,
            schedulePattern
        });
        
        // Staff ID validation
        const staffId = doctorId || labTechnicianId;
        const isDoctor = !!doctorId;
        
        if (!staffId || !startDate || (schedulePattern === 'recurring' && !workingDays)) {
            console.log("Validation failed:", { staffId, startDate, schedulePattern, workingDays });
            
            // Re-render form with error
            const specialties = await Specialty.findAll();
            const rooms = await Room.findAll();
            
            return res.render('vwAdmin/schedule/add', {
                specialties,
                rooms,
                error: 'All required fields must be provided',
                formData: req.body
            });
        }
        
        // Parse working days from string to array if necessary
        const workingDaysArray = typeof workingDays === 'string' ? [workingDays] : workingDays;
        
        console.log("Working days array:", workingDaysArray);
        
        // Check for database schema
        let hasLabTechnicianId = true;
        try {
            // Try to check if labTechnicianId exists in the Schedule table
            await db.schema.hasColumn('Schedule', 'labTechnicianId').then(exists => {
                hasLabTechnicianId = exists;
            });
            if (!hasLabTechnicianId) {
                console.log("labTechnicianId column doesn't exist in Schedule table");
            }
        } catch (error) {
            console.error("Error checking for labTechnicianId column:", error);
            hasLabTechnicianId = false;
        }
        
        // If it's a single day schedule
        if (schedulePattern === 'single' || !endDate || startDate === endDate) {
            // Create a single schedule entry
            const scheduleData = {
                doctorId: isDoctor ? staffId : null,
                labTechnicianId: (!isDoctor && hasLabTechnicianId) ? staffId : null,
                workDate: startDate,
                startTime,
                endTime,
                roomId: roomId || null,
                status: status || 'available'
            };
            
            console.log("Creating single schedule:", scheduleData);
            const schedule = new Schedule(scheduleData);
            await schedule.save();
            console.log("Single schedule created with ID:", schedule.scheduleId);
        } else {
            // For recurring schedules
            // Generate dates between start and end dates
            const dates = [];
            let currentDate = moment(startDate);
            const lastDate = moment(endDate);
            
            console.log(`Generating dates from ${currentDate.format('YYYY-MM-DD')} to ${lastDate.format('YYYY-MM-DD')}`);
            console.log(`Looking for days: ${workingDaysArray.join(', ')}`);
            
            while (currentDate.isSameOrBefore(lastDate)) {
                // Check if the day of week is in working days
                const dayOfWeek = currentDate.day(); // 0 for Sunday, 1 for Monday, etc.
                const dayOfWeekStr = dayOfWeek.toString();
                
                if (workingDaysArray.includes(dayOfWeek) || workingDaysArray.includes(dayOfWeekStr)) {
                    dates.push(currentDate.format('YYYY-MM-DD'));
                    console.log(`Added date: ${currentDate.format('YYYY-MM-DD')} (day ${dayOfWeek})`);
                } else {
                    console.log(`Skipped date: ${currentDate.format('YYYY-MM-DD')} (day ${dayOfWeek})`);
                }
                currentDate.add(1, 'day');
            }
            
            console.log(`Generated ${dates.length} dates:`, dates);
            
            if (dates.length === 0) {
                return res.render('vwAdmin/schedule/add', {
                    specialties: await Specialty.findAll(),
                    rooms: await Room.findAll(),
                    error: 'No valid dates were generated with the selected working days',
                    formData: req.body
                });
            }
            
            // Create schedule entries for all dates
            const schedules = dates.map(date => {
                // Ensure the date is properly formatted for MySQL (YYYY-MM-DD)
                const formattedDate = moment(date).format('YYYY-MM-DD');
                return {
                    doctorId: isDoctor ? staffId : null,
                    labTechnicianId: (!isDoctor && hasLabTechnicianId) ? staffId : null,
                    workDate: formattedDate,
                    startTime,
                    endTime,
                    roomId: roomId || null,
                    status: status || 'available'
                };
            });
            
            if (schedules.length > 0) {
                console.log(`Adding ${schedules.length} schedules.`);
                try {
                    // Log each schedule being added for debugging
                    schedules.forEach((schedule, index) => {
                        console.log(`Schedule ${index + 1}:`, schedule);
                    });
                    
                    // Check for potential duplicate schedules in the database
                    const duplicateCheckPromises = schedules.map(async schedule => {
                        let duplicateCheckQuery = db('Schedule').where('workDate', schedule.workDate);
                        
                        if (schedule.doctorId) {
                            duplicateCheckQuery = duplicateCheckQuery.where('doctorId', schedule.doctorId)
                                .where('startTime', schedule.startTime);
                        } else if (schedule.labTechnicianId) {
                            duplicateCheckQuery = duplicateCheckQuery.where('labTechnicianId', schedule.labTechnicianId)
                                .where('startTime', schedule.startTime);
                        }
                        
                        if (schedule.roomId) {
                            duplicateCheckQuery = duplicateCheckQuery.where('roomId', schedule.roomId)
                                .where('startTime', schedule.startTime);
                        }
                        
                        const duplicates = await duplicateCheckQuery.select('scheduleId');
                        return duplicates.length > 0 ? { 
                            isDuplicate: true, 
                            schedule, 
                            existingId: duplicates[0]?.scheduleId
                        } : { 
                            isDuplicate: false, 
                            schedule 
                        };
                    });
                    
                    const duplicateCheckResults = await Promise.all(duplicateCheckPromises);
                    const duplicates = duplicateCheckResults.filter(result => result.isDuplicate);
                    
                    if (duplicates.length > 0) {
                        console.warn(`Found ${duplicates.length} potentially duplicate schedules:`, duplicates);
                        // Filter out duplicates
                        const uniqueSchedules = schedules.filter((schedule, index) => 
                            !duplicateCheckResults[index].isDuplicate
                        );
                        
                        if (uniqueSchedules.length === 0) {
                            throw new Error('All scheduled entries would be duplicates. No schedules were added.');
                        }
                        
                        console.log(`Proceeding with ${uniqueSchedules.length} unique schedules after filtering out duplicates.`);
                        await Schedule.bulkAdd(uniqueSchedules);
                    } else {
                        // No duplicates found, proceed with all schedules
                        await Schedule.bulkAdd(schedules);
                    }
                    
                    console.log("Bulk schedules created");
                } catch (error) {
                    console.error("Error adding schedules in bulk:", error);
                    throw new Error('Failed to add schedules in bulk: ' + error.message);
                }
            } else {
                console.warn("No schedules were created!");
            }
        }
        
        // Redirect to schedule view with success message
        req.session.flashMessage = {
            type: 'success',
            message: 'Work schedule successfully created'
        };
        res.redirect('/admin/schedule');
    } catch (error) {
        console.error('Error adding schedule:', error);
        // Re-render form with error
        const specialties = await Specialty.findAll();
        const rooms = await Room.findAll();
        
        res.render('vwAdmin/schedule/add', {
            specialties,
            rooms,
            error: 'Failed to create work schedule: ' + error.message,
            formData: req.body
        });
    }
});

// POST: Delete a schedule
router.post('/delete/:scheduleId', async function (req, res) {
    try {
        const scheduleId = parseInt(req.params.scheduleId);
        
        if (isNaN(scheduleId)) {
            return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
        }
        
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        
        const success = await schedule.delete();
        
        if (success) {
            return res.json({ success: true, message: 'Schedule deleted successfully' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to delete schedule' });
        }
    } catch (error) {
        console.error(`Error deleting schedule ${req.params.scheduleId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
});

// POST: Update schedule status
router.post('/update-status/:scheduleId', async function (req, res) {
    try {
        const scheduleId = parseInt(req.params.scheduleId);
        const { status } = req.body;
        
        if (isNaN(scheduleId) || !status) {
            return res.status(400).json({ success: false, message: 'Invalid schedule ID or status' });
        }
        
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        
        await schedule.updateStatus(status);
        
        return res.json({ success: true, message: 'Schedule status updated successfully' });
    } catch (error) {
        console.error(`Error updating schedule status ${req.params.scheduleId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to update schedule status' });
    }
});

// GET: Schedule detail data for AJAX
router.get('/detail/:scheduleId', async function (req, res) {
    try {
        const scheduleId = parseInt(req.params.scheduleId);
        
        if (isNaN(scheduleId)) {
            return res.status(400).json({ success: false, message: 'Invalid schedule ID' });
        }
        
        const schedule = await Schedule.findById(scheduleId);
        
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }
        
        return res.json({ success: true, schedule });
    } catch (error) {
        console.error(`Error fetching schedule detail ${req.params.scheduleId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch schedule detail' });
    }
});

// AJAX endpoint to get doctors by specialty
router.get('/api/doctors-by-specialty/:specialtyId', async function (req, res) {
    try {
        const specialtyId = parseInt(req.params.specialtyId);
        
        if (isNaN(specialtyId)) {
            return res.status(400).json({ success: false, message: 'Invalid specialty ID' });
        }
        
        const doctors = await Doctor.findBySpecialty(specialtyId);
        
        return res.json({ success: true, doctors });
    } catch (error) {
        console.error(`Error fetching doctors by specialty ${req.params.specialtyId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
    }
});

// AJAX endpoint to get lab technicians by specialty
router.get('/api/labtechs-by-specialty/:specialtyId', async function (req, res) {
    try {
        const specialtyId = parseInt(req.params.specialtyId);
        
        if (isNaN(specialtyId)) {
            return res.status(400).json({ success: false, message: 'Invalid specialty ID' });
        }
        
        const labTechnicians = await LabTechnician.findBySpecialty(specialtyId);
        
        return res.json({ success: true, labTechnicians });
    } catch (error) {
        console.error(`Error fetching lab technicians by specialty ${req.params.specialtyId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch lab technicians' });
    }
});

// AJAX endpoint to get rooms by specialty
router.get('/api/rooms-by-specialty/:specialtyId', async function (req, res) {
    try {
        const specialtyId = parseInt(req.params.specialtyId);
        
        if (isNaN(specialtyId)) {
            return res.status(400).json({ success: false, message: 'Invalid specialty ID' });
        }
        
        const rooms = await Room.findBySpecialty(specialtyId);
        console.log(`Fetched ${rooms.length} rooms for specialty ID ${specialtyId}`);
        
        return res.json({ success: true, rooms });
    } catch (error) {
        console.error(`Error fetching rooms by specialty ${req.params.specialtyId}:`, error);
        return res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
});

// Helper: Generate array of day labels for the calendar
function generateDayLabels(startDate = null, endDate = null) {
    const days = [];
    
    // Default to current week if no dates provided
    const start = startDate ? moment(startDate) : moment().startOf('week');
    const end = endDate ? moment(endDate) : moment(start).add(6, 'days');
    
    let current = moment(start);
    while (current.isSameOrBefore(end)) {
        days.push({
            date: current.format('YYYY-MM-DD'),
            dayName: current.format('dddd'),
            dayMonth: current.format('MMM D')
        });
        current.add(1, 'day');
    }
    
    return days;
}

// Helper: Generate time slots for the calendar
function generateTimeSlots() {
    return [
        {
            time: '07:00',
            label: 'Morning',
            description: '7:00 - 11:30'
        },
        {
            time: '13:00',
            label: 'Afternoon',
            description: '13:00 - 16:30'
        }
    ];
}

// Helper: Format schedules data for the calendar view
function formatCalendarData(schedules, doctors, labTechnicians, startDate, endDate) {
    const calendarData = {
        doctors: {},
        labTechnicians: {}
    };
    
    // Process doctor schedules
    schedules.forEach(schedule => {
        if (!calendarData.doctors[schedule.doctorId]) {
            // Find doctor data
            const doctor = doctors.find(d => d.doctorId === schedule.doctorId);
            if (doctor) {
                calendarData.doctors[schedule.doctorId] = {
                    id: doctor.doctorId,
                    name: doctor.fullName,
                    specialty: doctor.specialtyName,
                    schedules: {}
                };
            }
        }
        
        if (calendarData.doctors[schedule.doctorId]) {
            const dateKey = moment(schedule.workDate).format('YYYY-MM-DD');
            
            if (!calendarData.doctors[schedule.doctorId].schedules[dateKey]) {
                calendarData.doctors[schedule.doctorId].schedules[dateKey] = [];
            }
            
            calendarData.doctors[schedule.doctorId].schedules[dateKey].push({
                id: schedule.scheduleId,
                start: schedule.startTime,
                end: schedule.endTime,
                room: schedule.roomNumber || 'No Room',
                status: schedule.status
            });
        }
    });
    
    // Add lab technicians (no schedules currently in the system, just add basic info)
    labTechnicians.forEach(tech => {
        calendarData.labTechnicians[tech.technicianId] = {
            id: tech.technicianId,
            name: tech.fullName,
            specialty: tech.specialtyName,
            specialization: tech.specialization || 'General'
        };
    });
    
    return calendarData;
}

// Utility route to create test doctor schedules (for development only)
router.get('/create-test-schedules', async function (req, res) {
    try {
        const startDate = moment().startOf('week').format('YYYY-MM-DD');
        const endDate = moment().add(14, 'days').format('YYYY-MM-DD');
        const doctors = await Doctor.findAll();
        
        if (doctors.length === 0) {
            return res.json({ success: false, message: 'No doctors found to create schedules' });
        }
        
        const rooms = await Room.findAll();
        if (rooms.length === 0) {
            return res.json({ success: false, message: 'No rooms found to create schedules' });
        }
        
        // Create some sample doctor schedules for testing
        const schedules = [];
        
        // Create morning schedules for first 3 doctors on Monday, Wednesday, Friday
        for (let i = 0; i < Math.min(doctors.length, 3); i++) {
            const doctor = doctors[i];
            const room = rooms[i % rooms.length];
            
            // Monday, Wednesday, Friday morning shifts
            const workingDays = [1, 3, 5]; // Monday, Wednesday, Friday
            
            workingDays.forEach(dayOfWeek => {
                let currentDate = moment(startDate);
                
                // Find the first occurrence of this day of the week
                while (currentDate.day() !== dayOfWeek) {
                    currentDate.add(1, 'day');
                }
                
                // Add schedules for this day and the next week
                for (let week = 0; week < 2; week++) {
                    const date = moment(currentDate).add(week * 7, 'days').format('YYYY-MM-DD');
                    
                    schedules.push({
                        doctorId: doctor.doctorId,
                        workDate: date,
                        startTime: '07:00:00',
                        endTime: '11:30:00',
                        roomId: room.roomId,
                        status: 'available'
                    });
                }
            });
        }
        
        // Create afternoon schedules for next 3 doctors on Tuesday, Thursday
        for (let i = 3; i < Math.min(doctors.length, 6); i++) {
            const doctor = doctors[i];
            const room = rooms[i % rooms.length];
            
            // Tuesday, Thursday afternoon shifts
            const workingDays = [2, 4]; // Tuesday, Thursday
            
            workingDays.forEach(dayOfWeek => {
                let currentDate = moment(startDate);
                
                // Find the first occurrence of this day of the week
                while (currentDate.day() !== dayOfWeek) {
                    currentDate.add(1, 'day');
                }
                
                // Add schedules for this day and the next week
                for (let week = 0; week < 2; week++) {
                    const date = moment(currentDate).add(week * 7, 'days').format('YYYY-MM-DD');
                    
                    schedules.push({
                        doctorId: doctor.doctorId,
                        workDate: date,
                        startTime: '13:00:00',
                        endTime: '16:30:00',
                        roomId: room.roomId,
                        status: 'available'
                    });
                }
            });
        }
        
        // Add weekend schedules for 2 doctors
        for (let i = 6; i < Math.min(doctors.length, 8); i++) {
            const doctor = doctors[i];
            const room = rooms[i % rooms.length];
            
            // Saturday, Sunday shifts
            const workingDays = [0, 6]; // Sunday, Saturday
            
            workingDays.forEach(dayOfWeek => {
                let currentDate = moment(startDate);
                
                // Find the first occurrence of this day of the week
                while (currentDate.day() !== dayOfWeek) {
                    currentDate.add(1, 'day');
                }
                
                // Add schedules for this day and the next week
                for (let week = 0; week < 2; week++) {
                    const date = moment(currentDate).add(week * 7, 'days').format('YYYY-MM-DD');
                    
                    // Morning shift
                    schedules.push({
                        doctorId: doctor.doctorId,
                        workDate: date,
                        startTime: '07:00:00',
                        endTime: '11:30:00',
                        roomId: room.roomId,
                        status: 'available'
                    });
                    
                    // Afternoon shift
                    schedules.push({
                        doctorId: doctor.doctorId,
                        workDate: date,
                        startTime: '13:00:00',
                        endTime: '16:30:00',
                        roomId: room.roomId,
                        status: 'available'
                    });
                }
            });
        }
        
        console.log(`Created ${schedules.length} doctor schedules`);
        
        if (schedules.length > 0) {
            await Schedule.bulkAdd(schedules);
            return res.json({ 
                success: true, 
                message: `Successfully created ${schedules.length} test doctor schedules`, 
                schedules 
            });
        } else {
            return res.json({ success: false, message: 'No schedules were created' });
        }
    } catch (error) {
        console.error('Error creating test schedules:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error creating test schedules: ' + error.message 
        });
    }
});

export default router; 