import express from 'express';
import scheduleService from '../../services/doctor-side-service/schedule.service.js';
import moment from 'moment';

const router = express.Router();

// Middleware for layout and active sidebar item
router.use((req, res, next) => {
  res.locals.layout = 'doctor';
  res.locals.active = 'schedule'; 
  next();
});

// Handlebars helpers for date and time formatting
router.use((req, res, next) => {
  res.locals.helpers = {
    ...res.locals.helpers,
    formatDate: (date) => {
      try {
        return moment(date).format('DD MMM YYYY');
      } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'Invalid date';
      }
    },
    formatTime: (time) => {
      try {
        if (!time) return 'N/A';
        return moment(time, 'HH:mm:ss').format('h:mm A');
      } catch (error) {
        console.error('Error formatting time:', time, error);
        return 'Invalid time';
      }
    }
  };
  next();
});

router.get('/', async (req, res) => {
  try {
    // Get doctor ID from session
    const doctorId = req.session.authUser?.doctorId;
    console.log('Doctor ID from session:', doctorId);
    
    // Check if doctor is logged in
    if (!doctorId) {
      return res.redirect('/account/login'); // Redirect to login page if not logged in
    }
    
    // Get date from query params or use current date
    const selectedDate = req.query.date || moment().format('YYYY-MM-DD');
    console.log('Selected Date:', selectedDate);
    
    // For calendar view, get schedules for the month
    const monthStart = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
    const monthEnd = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
    console.log('Date Range:', monthStart, 'to', monthEnd);
    
    // Query schedules from database
    let todaySchedules = [];
    let monthSchedules = [];
    
    try {
      todaySchedules = await scheduleService.getDoctorSchedules(doctorId, selectedDate);
      console.log(`Found ${todaySchedules.length} schedules for today`);
    } catch (error) {
      console.error('Error fetching today schedules:', error);
    }
    
    try {
      monthSchedules = await scheduleService.getDoctorSchedulesByDateRange(doctorId, monthStart, monthEnd);
      console.log(`Found ${monthSchedules.length} schedules for month`);
    } catch (error) {
      console.error('Error fetching month schedules:', error);
    }
    
    // Format schedules for calendar
    let scheduleEvents = [];
    try {
      scheduleEvents = scheduleService.formatSchedulesForCalendar(monthSchedules);
      console.log(`Formatted ${scheduleEvents.length} events for calendar`);
    } catch (error) {
      console.error('Error formatting schedules for calendar:', error);
    }
    
    // Get summary of schedules
    let summary = { total: 0, available: 0, fullfilled: 0 };
    try {
      summary = await scheduleService.getSummaryByDoctorAndDateRange(
        doctorId, 
        moment().startOf('month').format('YYYY-MM-DD'),
        moment().endOf('month').format('YYYY-MM-DD')
      );
      console.log('Schedule Summary:', summary);
    } catch (error) {
      console.error('Error getting schedule summary:', error);
    }
    
    res.render('vwDoctor/schedule', {
      doctorSchedules: todaySchedules,
      selectedDate: selectedDate,
      scheduleEvents: JSON.stringify(scheduleEvents),
      summary: summary
    });
    
  } catch (error) {
    console.error('Error loading doctor schedules:', error);
    res.render('vwDoctor/schedule', { 
      error: 'Could not load schedule data',
      doctorSchedules: [],
      scheduleEvents: JSON.stringify([])
    });
  }
});

export default router; 