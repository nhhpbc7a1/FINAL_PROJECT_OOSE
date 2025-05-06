import express from 'express';
import specialtyDetailService from '../../services/patient/specialty.service.js';

const router = express.Router();

// GET: Display specialty details page
router.get('/:specialtyId', async function (req, res) {
  try {
    const specialtyId = parseInt(req.params.specialtyId, 10);

    
    if (isNaN(specialtyId)) {
      return res.redirect('/'); // Redirect to homepage if invalid ID
    }
    
    // Get specialty, doctors, services, and schedules
    const specialtyDetails = await specialtyDetailService.getSpecialtyDetails(specialtyId);
    
    console.log(specialtyDetails);
    
    if (!specialtyDetails.specialty) {
      return res.redirect('/'); // Redirect if specialty not found
    }

    // Get current date for schedule
    const today = new Date();
    // Format date to YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];
    
    // Create date range for schedule (next 7 days)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6);
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Get doctor schedules for the next 7 days
    const schedules = await specialtyDetailService.getDoctorSchedules(
      specialtyId,
      formattedToday,
      formattedEndDate
    );

    res.render('vwPatient/specialty/specialty_detail', {
      specialty: specialtyDetails.specialty,
      doctors: specialtyDetails.doctors,
      services: specialtyDetails.services,
      schedules: schedules,
      startDate: formattedToday,
      endDate: formattedEndDate
    });

  } catch (error) {
    console.error('Error loading specialty details:', error);
    res.redirect('/');
  }
});

export default router; 