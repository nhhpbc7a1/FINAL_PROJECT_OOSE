import express from 'express';
import Service from '../../models/Service.js';
import Specialty from '../../models/Specialty.js';

const router = express.Router();

// GET: Display all services with optional filters
router.get('/', async function (req, res) {
  try {
    // Get query parameters
    const specialtyId = req.query.specialty ? parseInt(req.query.specialty, 10) : null;
    const type = req.query.type || null;
    
    // Get all services
    let services;
    
    if (specialtyId && type) {
      // Get services filtered by both specialty and type
      const servicesData = await Service.findBySpecialty(specialtyId, false);
      services = servicesData.filter(service => service.type === type);
    } else if (specialtyId) {
      // Get services filtered by specialty only
      services = await Service.findBySpecialty(specialtyId, false);
    } else if (type) {
      // Get all services filtered by type
      const allServices = await Service.findAll(false); // false means active only
      services = allServices.filter(service => service.type === type);
    } else {
      // Get all active services
      services = await Service.findAll(false); // false means active only
    }
    
    // Format prices for all services
    services.forEach(service => {
      service.formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(service.price);
    });
    
    // Get all specialties for the filter dropdown
    const specialties = await Specialty.findAll();
    
    // Get selected specialty name if filter is active
    let selectedSpecialty = null;
    if (specialtyId) {
      const specialty = await Specialty.findById(specialtyId);
      if (specialty) {
        selectedSpecialty = specialty.name;
      }
    }
    
    // Service types for filter
    const serviceTypes = [
      { value: 'service', label: 'Services' },
      { value: 'test', label: 'Tests' },
      { value: 'procedure', label: 'Procedures' }
    ];
    
    res.render('vwPatient/list/services_list', {
      services,
      specialties,
      serviceTypes,
      selectedSpecialtyId: specialtyId,
      selectedSpecialty,
      selectedType: type,
      title: "Our Medical Services",
      description: "Explore our comprehensive range of medical services, tests, and procedures. Use the filters to find exactly what you need."
    });
  } catch (error) {
    console.error('Error loading services list:', error);
    res.render('vwPatient/list/services_list', {
      services: [],
      specialties: [],
      serviceTypes: [],
      error: 'Could not load services at this time. Please try again later.'
    });
  }
});

// GET: Display service details
router.get('/:id', async function (req, res) {
  try {
    const serviceId = parseInt(req.params.id, 10);
    
    if (isNaN(serviceId)) {
      return res.status(400).render('vwPatient/list/service_detail', { error: 'Invalid service ID' });
    }
    
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).render('vwPatient/list/service_detail', { error: 'Service not found' });
    }
    
    // Format price
    service.formattedPrice = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(service.price);
    
    // Get related services (same specialty or type)
    let relatedServices = [];
    
    if (service.specialtyId) {
      relatedServices = await Service.findBySpecialty(service.specialtyId, false);
      relatedServices = relatedServices.filter(s => s.serviceId !== service.serviceId).slice(0, 4);
      
      // Format prices for related services
      relatedServices.forEach(relService => {
        relService.formattedPrice = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(relService.price);
      });
    }
    
    res.render('vwPatient/list/service_detail', {
      service,
      relatedServices
    });
  } catch (error) {
    console.error('Error loading service details:', error);
    res.render('vwPatient/list/service_detail', {
      error: 'Could not load service details at this time. Please try again later.'
    });
  }
});

export default router; 