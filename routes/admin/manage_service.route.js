import express from 'express';
import serviceService from '../../services/service.service.js';
import specialtyService from '../../services/specialty.service.js'; // Needed for dropdown

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'services'; // Set current route highlight
    next();
});

// GET: Display list of services
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Check for search query
    const searchQuery = req.query.search || '';
    let services;
    if (searchQuery) {
        services = await serviceService.search(searchQuery);
    } else {
        // Fetch all services including inactive ones for the admin list view
        services = await serviceService.findAll(true);
    }

    res.render('vwAdmin/manage_service/service_list', {
      services,
      totalServices: services.length,
      searchQuery
    });
  } catch (error) {
    console.error('Error loading services:', error);
    res.render('vwAdmin/manage_service/service_list', { error: 'Failed to load services' });
  }
});

// GET: Display form to add a new service
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Service';
    const specialties = await specialtyService.findAll(); // Get all specialties for dropdown

    let formData = {};
    if (req.session.formData) {
      formData = req.session.formData;
      delete req.session.formData;
    }

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_service/add_service', {
      specialties,
      service: formData, // Repopulate form on error
      error
    });
  } catch (error) {
    console.error('Error loading add service form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add service form.' };
    res.redirect('/admin/manage_service');
  }
});

// POST: Handle adding a new service
router.post('/add', async function (req, res, next) {
  req.session.returnTo = '/admin/manage_service/add'; // For error redirection

  try {
    const { name, description, price, duration, type, category, specialtyId, status } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the service name.');
    if (!price || price.trim() === '') throw new Error('Please enter the service price.');
    if (!type) throw new Error('Please select a service type.');
    if (duration && (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) < 0)) {
        throw new Error('Duration must be a non-negative number.');
    }
    const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }

    // Check uniqueness
    const isUnique = await serviceService.isNameUnique(name.trim());
    if (!isUnique) {
        throw new Error(`Service name "${name.trim()}" already exists.`);
    }

    // --- Prepare Data ---
    const serviceData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        duration: duration ? parseInt(duration, 10) : null,
        type: type,
        category: category ? category.trim() : null,
        specialtyId: specialtyId || null, // Allow null specialty
        status: status || 'active'
    };

    // --- Database Operation ---
    await serviceService.add(serviceData);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Service added successfully!' };
    res.redirect('/admin/manage_service');

  } catch (error) {
    console.error('Error adding service:', error);
    req.session.formData = req.body; // Save form data
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add service.' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit an existing service
router.get('/edit/:serviceId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Service';
    const serviceId = parseInt(req.params.serviceId, 10);

    if (isNaN(serviceId)) throw new Error('Invalid Service ID.');

    const service = await serviceService.findById(serviceId);
    if (!service) {
      req.session.flashMessage = { type: 'danger', message: 'Service not found.' };
      return res.redirect('/admin/manage_service');
    }

    const specialties = await specialtyService.findAll(); // Get all specialties for dropdown

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_service/edit_service', {
      service,
      specialties,
      error
    });

  } catch (error) {
    console.error('Error loading edit service form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_service');
  }
});

// POST: Handle updating an existing service
router.post('/update/:serviceId', async function (req, res, next) {
  const serviceId = parseInt(req.params.serviceId, 10);
  req.session.returnTo = `/admin/manage_service/edit/${serviceId}`; // For error redirection

  if (isNaN(serviceId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Service ID.' };
      return res.redirect('/admin/manage_service');
  }

  try {
     const { name, description, price, duration, type, category, specialtyId, status } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the service name.');
    if (!price || price.trim() === '') throw new Error('Please enter the service price.');
    if (!type) throw new Error('Please select a service type.');
     if (duration && (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) < 0)) {
        throw new Error('Duration must be a non-negative number.');
    }
    const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }
    if (!status) throw new Error('Please select a status.');


    // Check uniqueness (excluding current ID)
    const isUnique = await serviceService.isNameUnique(name.trim(), serviceId);
    if (!isUnique) {
        throw new Error(`Service name "${name.trim()}" already exists.`);
    }

    // --- Prepare Data ---
    // Service update method handles which fields were actually submitted
     const serviceData = {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        duration: duration ? parseInt(duration, 10) : null,
        type: type,
        category: category ? category.trim() : null,
        specialtyId: specialtyId || null,
        status: status
    };

    // --- Database Operation ---
    const updated = await serviceService.update(serviceId, serviceData);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Service updated successfully!' };
    res.redirect('/admin/manage_service');

  } catch (error) {
    console.error(`Error updating service ID ${serviceId}:`, error);
    req.session.formData = req.body; // Save potentially incorrect data for repopulation
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update service.' };
    res.redirect(req.session.returnTo); // Redirect back to edit form
  }
});


// DELETE: Handle service deletion
router.delete('/delete/:serviceId', async function (req, res) {
  try {
    const serviceId = parseInt(req.params.serviceId, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid Service ID' });
    }

    // *** CRUCIAL: Dependency Check ***
    const hasDependencies = await serviceService.checkDependencies(serviceId);

    if (hasDependencies) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete service. It is currently included in appointments or test results. Please remove these associations first.'
        });
    }

    // If checks pass, proceed with deletion
    const deleted = await serviceService.delete(serviceId);

    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Service not found or already deleted.' });
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Service deleted successfully',
      serviceId: serviceId
    });

  } catch (error) {
    console.error(`Error deleting service:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the service.'
    });
  }
});

// API endpoint for AJAX name uniqueness check
router.get('/api/check-name', async (req, res) => {
     const name = req.query.name;
     const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

     if (!name) {
         return res.status(400).json({ isUnique: false, message: 'Name parameter is required.' });
     }

     try {
         const isUnique = await serviceService.isNameUnique(name, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Service Name Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking name.' });
     }
 });


export default router;