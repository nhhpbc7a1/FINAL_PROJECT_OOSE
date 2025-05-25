import express from 'express';
import Specialty from '../../models/Specialty.js';
import Doctor from '../../models/Doctor.js';
import Service from '../../models/Service.js';

const router = express.Router();

// GET: Display specialty details page
router.get('/:specialtyId', async function (req, res) {
  try {
    const specialtyId = parseInt(req.params.specialtyId, 10);

    if (isNaN(specialtyId)) {
      return res.redirect('/'); // Redirect to homepage if invalid ID
    }
    
    // Get specialty details using models
    const specialty = await Specialty.findById(specialtyId);
    
    if (!specialty) {
      return res.redirect('/'); // Redirect if specialty not found
    }

    // Get doctors by specialty
    const doctors = await Doctor.findBySpecialty(specialtyId);
    
    // Get services by specialty
    const services = await Service.findBySpecialty(specialtyId);
    
    console.log({
      specialty,
      doctors: doctors.length,
      services: services.length
    });
    
    res.render('vwPatient/specialty/specialty_detail', {
      specialty,
      doctors,
      services
    });

  } catch (error) {
    console.error('Error loading specialty details:', error);
    res.redirect('/');
  }
});

export default router; 