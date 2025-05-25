import express from 'express';
import Specialty from '../../models/Specialty.js';

const router = express.Router();

// GET: Display all specialties
router.get('/', async function (req, res) {
  try {
    // Get all specialties using the Specialty model
    const specialties = await Specialty.findAll();

    console.log('Specialties:', specialties);
    
    res.render('vwPatient/list/specialties_list', {
      specialties,
      title: "Medical Specialties",
      description: "Explore our comprehensive range of medical specialties. Our expert doctors are here to provide the best care for your health needs."
    });
  } catch (error) {
    console.error('Error loading specialties list:', error);
    res.render('vwPatient/list/specialties_list', {
      specialties: [],
      error: 'Could not load specialties at this time. Please try again later.'
    });
  }
});

export default router; 