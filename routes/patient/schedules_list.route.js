import express from 'express';
import specialtyService from '../../services/specialty.service.js';
import scheduleService from '../../services/schedule.service.js';
import moment from 'moment';

const router = express.Router();

router.get('/', async function (req, res) {
    try {
        // Get filter parameters
        const specialtyId = req.query.specialty || null;
        const dateFilter = req.query.date || moment().format('YYYY-MM-DD');
        const timeFilter = req.query.time || null;
        
        // Calculate date range for the week (start from the selected date)
        const startDate = moment(dateFilter).startOf('week').format('YYYY-MM-DD');
        const endDate = moment(dateFilter).endOf('week').format('YYYY-MM-DD');
        
        // Get all specialties for the filter dropdown
        const specialties = await specialtyService.findAll();
        
        // Get schedules for the date range
        let schedules = await scheduleService.findByDateRange(startDate, endDate);
        
        console.log('Raw schedules count:', schedules.length);
        console.log('Raw schedule example:', schedules.length > 0 ? {
            scheduleId: schedules[0].scheduleId,
            workDate: schedules[0].workDate,
            startTime: schedules[0].startTime,
            doctorId: schedules[0].doctorId,
            staffType: schedules[0].staffType,
            specialtyId: schedules[0].specialtyId,
            specialtyName: schedules[0].specialtyName
        } : 'No schedules found');
        
        // Format workDate to YYYY-MM-DD for comparison in the template
        schedules = schedules.map(schedule => {
            return {
                ...schedule,
                workDate: moment(schedule.workDate).format('YYYY-MM-DD')
            };
        });
        
        console.log('Formatted schedule example:', schedules.length > 0 ? {
            scheduleId: schedules[0].scheduleId,
            workDate: schedules[0].workDate,
            startTime: schedules[0].startTime
        } : 'No schedules found');
        
        console.log('Sample schedule:', schedules.length > 0 ? schedules[0] : 'No schedules found');
        
        // Apply specialty filter if provided
        if (specialtyId) {
            schedules = schedules.filter(schedule => schedule.specialtyId === parseInt(specialtyId));
        }
        
        // Apply time filter if provided
        if (timeFilter) {
            if (timeFilter === 'morning') {
                schedules = schedules.filter(schedule => schedule.startTime.startsWith('07:'));
            } else if (timeFilter === 'afternoon') {
                schedules = schedules.filter(schedule => schedule.startTime.startsWith('13:'));
            }
        }
        
        // Generate days array for the calendar (full week Mon-Sun)
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = moment(startDate).add(i, 'days');
            days.push({
                date: date.format('YYYY-MM-DD'),
                dayName: date.format('ddd'),
                dayMonth: date.format('MMM D')
            });
        }
        
        // Generate time slots for the calendar
        const timeSlots = [
            { time: '07:00', label: '7:00 AM', description: 'Morning Session' },
            { time: '13:00', label: '1:00 PM', description: 'Afternoon Session' }
        ];
        
        // Get the selected specialty name (if any)
        let selectedSpecialtyName = '';
        if (specialtyId) {
            const selectedSpecialty = specialties.find(s => s.specialtyId === parseInt(specialtyId));
            if (selectedSpecialty) {
                selectedSpecialtyName = selectedSpecialty.name;
            }
        }
        
        // For week navigation
        const prevWeek = moment(startDate).subtract(7, 'days').format('YYYY-MM-DD');
        const nextWeek = moment(startDate).add(7, 'days').format('YYYY-MM-DD');
        
        console.log('Days array:', days);
        console.log('Found schedules:', schedules.length);
        
        res.render('vwPatient/list/schedules_list', {
            title: selectedSpecialtyName ? `Schedule: ${selectedSpecialtyName}` : 'Doctor Schedule',
            description: 'View doctor schedule and book an appointment',
            specialties,
            schedules,
            days,
            timeSlots,
            startDate,
            endDate,
            specialtyId,
            dateFilter,
            timeFilter,
            prevWeek,
            nextWeek,
            selectedSpecialtyName
        });
    } catch (error) {
        console.error('Error loading schedules:', error);
        res.render('vwPatient/list/schedules_list', {
            error: 'Cannot load schedule. Please try again later.'
        });
    }
});

export default router; 