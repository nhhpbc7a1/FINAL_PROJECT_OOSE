import express from 'express';
import doctorDetailService from '../../services/patient/doctor_detail.service.js';

const router = express.Router();

// GET: Display doctor details and their schedule
router.get('/:doctorId', async function (req, res) {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    
    if (isNaN(doctorId)) {
      return res.status(400).render('error', {
        message: 'Invalid doctor ID',
        error: { status: 400, stack: '' }
      });
    }
    
    // Get doctor details
    const doctor = await doctorDetailService.getDoctorById(doctorId);
    
    if (!doctor) {
      return res.status(404).render('error', {
        message: 'Doctor not found',
        error: { status: 404, stack: '' }
      });
    }
    
    // Get doctor's specialties
    const specialties = await doctorDetailService.getDoctorSpecialties(doctorId);
    
    // Get doctor's schedule for the next 7 days
    const schedule = await doctorDetailService.getDoctorSchedule(doctorId);
    
    // Get doctor's services
    const services = await doctorDetailService.getDoctorServices(doctorId);
    
    // Get doctor's reviews and ratings
    const reviews = await doctorDetailService.getDoctorReviews(doctorId);
    
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) 
      : 0;
    
    res.render('vwPatient/doctor/doctor_detail', {
      doctor,
      specialties,
      schedule,
      services,
      reviews,
      avgRating,
      reviewCount: reviews.length,
      title: `Dr. ${doctor.name} - Doctor Profile`,
      description: `Learn more about Dr. ${doctor.name}, qualifications, specialties, and available appointments.`
    });
  } catch (error) {
    console.error('Error loading doctor details:', error);
    res.status(500).render('error', {
      message: 'Could not load doctor details at this time. Please try again later.',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
});

export default router; 