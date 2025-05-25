import express from 'express';
import moment from 'moment';
import LabTechnician from '../../models/LabTechnician.js';
import TestRequest from '../../models/TestRequest.js';
import TestResult from '../../models/TestResult.js';
import Schedule from '../../models/Schedule.js';

const router = express.Router();

// Dashboard route - Shows summary statistics and recent test request
router.get('/', async (req, res) => {
    try {
        res.locals.activeRoute = 'dashboard';
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await LabTechnician.findByUserId(userId);
        
        if (!labTechnician) {
            return res.redirect('/account/login');
        }
        
        const technicianId = labTechnician.technicianId;
        
        // Get dashboard statistics using the TestResult model
        const stats = await TestResult.countByStatus(technicianId);
        
        // Get recent test requests using the TestRequest model
        const recentRequests = await TestRequest.getRecentBySpecialty(
            labTechnician.specialtyId,
            5 // Limit to 5 recent requests
        );
        
        res.render('vwLabtech/dashboard', {
            pendingCount: stats.pendingCount,
            inProgressCount: stats.inProgressCount,
            completedCount: stats.completedCount,
            totalCount: stats.totalCount,
            recentRequests: recentRequests,
            helpers: {
                formatDate: function(date) {
                    return moment(date).format('DD/MM/YYYY');
                }
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { 
            layout: 'labtech',
            message: 'Failed to load dashboard data' 
        });
    }
});

// Get schedule data for the calendar
router.get('/schedule-data', async (req, res) => {
    try {
        console.log('Fetching schedule data...');
        // Get month and year from query parameters, default to current month
        const month = parseInt(req.query.month) || new Date().getMonth();
        const year = parseInt(req.query.year) || new Date().getFullYear();
        
        // Calculate the start and end dates for the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const formattedStartDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedEndDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Get logged in lab technician ID
        const userId = req.session.authUser.userId;
        const labTechnician = await LabTechnician.findByUserId(userId);
        
        if (!labTechnician) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        
        const technicianId = labTechnician.technicianId;
        
        // Get schedule data for the month using the Schedule model
        const schedules = await Schedule.findByLabTechnician(technicianId);
        
        console.log("Raw schedules count:", schedules.length);
        if (schedules.length > 0) {
            console.log("Sample workDate format:", schedules[0].workDate, typeof schedules[0].workDate);
        }
        
        // Filter schedules for the current month
        const monthSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.workDate);
            // Check if date is valid before comparing
            if (isNaN(scheduleDate.getTime())) {
                console.log("Invalid date found:", schedule.workDate);
                return false;
            }
            const scheduleIsoDate = scheduleDate.toISOString().split('T')[0];
            return scheduleIsoDate >= formattedStartDate && scheduleIsoDate <= formattedEndDate;
        });

        console.log("Filtered month schedules count:", monthSchedules.length);
        console.log("First few schedules:", schedules.slice(0, 3));
        console.log("Technician ID:", technicianId);
        
        // Format the schedule data for the calendar
        const scheduleData = monthSchedules.map(schedule => {
            // Ensure workDate is formatted properly
            let formattedWorkDate;
            if (schedule.workDate instanceof Date) {
                formattedWorkDate = schedule.workDate.toISOString().split('T')[0];
            } else if (typeof schedule.workDate === 'string') {
                // If it's already a string, make sure it's in YYYY-MM-DD format
                const dateParts = schedule.workDate.split('T')[0].split('-');
                if (dateParts.length === 3) {
                    formattedWorkDate = dateParts.join('-'); // YYYY-MM-DD
                } else {
                    console.log("Invalid date format:", schedule.workDate);
                    formattedWorkDate = new Date().toISOString().split('T')[0]; // Fallback to today
                }
            } else {
                // Handle Date objects that come from database
                try {
                    const dateObj = new Date(schedule.workDate);
                    formattedWorkDate = dateObj.toISOString().split('T')[0];
                } catch (error) {
                    console.log("Error formatting date:", error);
                    formattedWorkDate = new Date().toISOString().split('T')[0]; // Fallback to today
                }
            }
            
            // Now create the calendar event object
            try {
                return {
                    id: schedule.scheduleId,
                    title: `Room ${schedule.roomNumber || 'TBD'} (${schedule.startTime?.substring(0, 5) || '00:00'} - ${schedule.endTime?.substring(0, 5) || '00:00'})`,
                    start: `${formattedWorkDate}T${schedule.startTime || '00:00:00'}`,
                    end: `${formattedWorkDate}T${schedule.endTime || '00:00:00'}`,
                    status: schedule.status || 'available',
                    room: schedule.roomNumber || 'TBD',
                    color: schedule.status === 'active' ? '#28a745' : '#dc3545'
                };
            } catch (error) {
                console.log("Error creating calendar event for schedule:", schedule.scheduleId, error);
                return null;
            }
        }).filter(Boolean); // Remove any null entries
        
        console.log('Final schedule data count:', scheduleData.length);
        if (scheduleData.length > 0) {
            console.log('Sample schedule data:', scheduleData[0]);
        } else {
            console.log('No schedule data after mapping. Schedule dates may be outside the requested month.');
        }

        console.log('scheduledata', scheduleData);

        return res.json({
            success: true,
            scheduleData
        });
    } catch (error) {
        console.error('Error fetching schedule data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load schedule data'
        });
    }
});

export default router;  