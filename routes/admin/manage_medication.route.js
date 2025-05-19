import express from 'express';
import Medication from '../../models/Medication.js';

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'medications'; // Set current route highlight
    next();
});

// GET: Display list of medications
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Check for search query
    const searchQuery = req.query.search || '';
    let medications;
    if (searchQuery) {
        medications = await Medication.search(searchQuery);
    } else {
        medications = await Medication.findAll();
    }

    res.render('vwAdmin/manage_medication/medication_list', {
      medications,
      totalMedications: medications.length,
      searchQuery // Pass search query back to view if needed
    });
  } catch (error) {
    console.error('Error loading medications:', error);
    res.render('vwAdmin/manage_medication/medication_list', { error: 'Failed to load medications' });
  }
});

// GET: Display form to add a new medication
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Medication';

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

    res.render('vwAdmin/manage_medication/add_medication', {
      medication: formData, // Repopulate form on error
      error
    });
  } catch (error) {
    console.error('Error loading add medication form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add medication form.' };
    res.redirect('/admin/manage_medication');
  }
});

// POST: Handle adding a new medication
router.post('/add', async function (req, res, next) {
  req.session.returnTo = '/admin/manage_medication/add'; // For error redirection

  try {
    const { name, description, dosage, price, category, manufacturer, sideEffects } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') {
      throw new Error('Please enter the medication name.');
    }
    if (price === undefined || price === null || price === '') {
       throw new Error('Please enter the medication price.');
    }
     // Price validation is also done in service, but good to have here too
     const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }

    // Check uniqueness
    const isUnique = await Medication.isNameUnique(name.trim());
    if (!isUnique) {
        throw new Error(`Medication name "${name.trim()}" already exists.`);
    }

    // --- Prepare Data and Save ---
    const medication = new Medication({
        name: name.trim(),
        description: description ? description.trim() : null,
        dosage: dosage ? dosage.trim() : null,
        price: numericPrice, // Use the parsed numeric price
        category: category ? category.trim() : null,
        manufacturer: manufacturer ? manufacturer.trim() : null,
        sideEffects: sideEffects ? sideEffects.trim() : null
    });

    await medication.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Medication added successfully!' };
    res.redirect('/admin/manage_medication');

  } catch (error) {
    console.error('Error adding medication:', error);
    req.session.formData = req.body; // Save form data
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add medication.' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit an existing medication
router.get('/edit/:medicationId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Medication';
    const medicationId = parseInt(req.params.medicationId, 10);

    if (isNaN(medicationId)) {
        throw new Error('Invalid Medication ID.');
    }

    const medication = await Medication.findById(medicationId);

    if (!medication) {
      req.session.flashMessage = { type: 'danger', message: 'Medication not found.' };
      return res.redirect('/admin/manage_medication');
    }

     let error = null;
     if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
       error = req.session.flashMessage.message;
       delete req.session.flashMessage;
     }

    res.render('vwAdmin/manage_medication/edit_medication', {
      medication,
      error
    });

  } catch (error) {
    console.error('Error loading edit medication form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_medication');
  }
});

// POST: Handle updating an existing medication
router.post('/update/:medicationId', async function (req, res, next) {
  const medicationId = parseInt(req.params.medicationId, 10);
   req.session.returnTo = `/admin/manage_medication/edit/${medicationId}`; // For error redirection

  if (isNaN(medicationId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Medication ID.' };
      return res.redirect('/admin/manage_medication');
  }

  try {
    const { name, description, dosage, price, category, manufacturer, sideEffects } = req.body;

    // --- Validation ---
     if (!name || name.trim() === '') {
      throw new Error('Please enter the medication name.');
    }
     if (price === undefined || price === null || price === '') {
       throw new Error('Please enter the medication price.');
    }
     const numericPrice = parseFloat(price);
     if (isNaN(numericPrice) || numericPrice < 0) {
          throw new Error('Price must be a non-negative number.');
     }

    // Check uniqueness (excluding current ID)
    const isUnique = await Medication.isNameUnique(name.trim(), medicationId);
    if (!isUnique) {
        throw new Error(`Medication name "${name.trim()}" already exists.`);
    }

    // --- Get existing medication and update it ---
    const medication = await Medication.findById(medicationId);
    if (!medication) {
        throw new Error('Medication not found.');
    }

    // Update medication properties
    medication.name = name.trim();
    medication.description = description ? description.trim() : null;
    medication.dosage = dosage ? dosage.trim() : null;
    medication.price = numericPrice;
    medication.category = category ? category.trim() : null;
    medication.manufacturer = manufacturer ? manufacturer.trim() : null;
    medication.sideEffects = sideEffects ? sideEffects.trim() : null;

    // Save the updated medication
    await medication.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Medication updated successfully!' };
    res.redirect('/admin/manage_medication');

  } catch (error) {
    console.error(`Error updating medication ID ${medicationId}:`, error);
     req.session.formData = req.body; // Save potentially incorrect data for repopulation
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update medication.' };
     res.redirect(req.session.returnTo); // Redirect back to edit form
  }
});

// DELETE: Handle medication deletion
router.delete('/delete/:medicationId', async function (req, res) {
  try {
    const medicationId = parseInt(req.params.medicationId, 10);

    if (isNaN(medicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid Medication ID' });
    }

    // *** CRUCIAL: Dependency Check ***
    const medication = await Medication.findById(medicationId);
    if (!medication) {
        return res.status(404).json({ success: false, message: 'Medication not found or already deleted.' });
    }
    
    const hasDependencies = await medication.checkDependencies();

    if (hasDependencies) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete medication. It is currently included in one or more prescriptions. Please remove it from prescriptions first.'
        });
    }

    // If checks pass, proceed with deletion
    const deleted = await medication.delete();

    if (!deleted) {
        // This might mean the medication was already deleted
        return res.status(404).json({ success: false, message: 'Medication not found or already deleted.' });
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Medication deleted successfully',
      medicationId: medicationId
    });

  } catch (error) {
    console.error(`Error deleting medication:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the medication.'
    });
  }
});

// Optional: API endpoint for AJAX name uniqueness check
router.get('/api/check-name', async (req, res) => {
     const name = req.query.name;
     const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

     if (!name) {
         return res.status(400).json({ isUnique: false, message: 'Name parameter is required.' });
     }

     try {
         const isUnique = await Medication.isNameUnique(name, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Medication Name Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking name.' });
     }
 });

export default router;