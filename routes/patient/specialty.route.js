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
    
    // Get specialty, doctors, services
    const specialtyDetails = await specialtyDetailService.getSpecialtyDetails(specialtyId);
    
    console.log(specialtyDetails);
    
    if (!specialtyDetails.specialty) {
      return res.redirect('/'); // Redirect if specialty not found
    }

    res.render('vwPatient/specialty/specialty_detail', {
      specialty: specialtyDetails.specialty,
      doctors: specialtyDetails.doctors,
      services: specialtyDetails.services
    });

  } catch (error) {
    console.error('Error loading specialty details:', error);
    res.redirect('/');
  }
});

export default router; 