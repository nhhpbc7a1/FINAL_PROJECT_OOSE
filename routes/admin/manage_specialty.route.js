import express from 'express';
import Specialty from '../../models/Specialty.js';
import Service from '../../models/Service.js';
import Doctor from '../../models/Doctor.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { authAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/images/specialties/');

// Ensure upload directory exists
const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } else {
      console.error('Error checking/creating upload directory:', error);
    }
  }
};
ensureUploadDirExists();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'specialties'; // Set current route highlight
    next();
});

// GET: Display list of specialties
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    const specialties = await Specialty.findAll();

    res.render('vwAdmin/manage_specialty/specialty_list', {
      specialties,
      totalSpecialties: specialties.length
    });
  } catch (error) {
    console.error('Error loading specialties:', error);
    res.render('vwAdmin/manage_specialty/specialty_list', { error: 'Failed to load specialties' });
  }
});

// GET: Display form to add a new specialty
router.get('/add', authAdmin, async (req, res) => {
    try {
        // Get all doctors for the head doctor dropdown
        const doctors = await Doctor.findAllWithNames();
        
        // Get session data and clear it
        const { error, success, formData } = req.session;
        req.session.error = null;
        req.session.success = null;
        req.session.formData = null;

        res.render('vwAdmin/manage_specialty/add_specialty', {
            title: 'Add Specialty',
            error,
            success,
            formData,
            doctors: doctors.filter(d => d.accountStatus === 'active')
        });
    } catch (err) {
        console.error('Could not load the add specialty form:', err);
        res.status(500).render('error', {
            message: 'Could not load the add specialty form.'
        });
    }
});

// POST: Handle adding a new specialty
router.post('/add', async function (req, res) {
  let iconPath = null;
  req.session.returnTo = '/admin/manage_specialty/add';

  try {
    const { name, description, headDoctorId } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the specialty name.');

    // Check uniqueness
    const isUnique = await Specialty.isNameUnique(name.trim());
    if (!isUnique) {
      throw new Error(`Specialty name "${name.trim()}" already exists.`);
    }

    // --- File Upload Handling ---
    if (req.files && req.files.icon) {
      const icon = req.files.icon;
      
      // Check file type
      const fileExtension = path.extname(icon.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (icon.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `specialty-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);
      
      try {
        await icon.mv(uploadPath);
        iconPath = `/public/images/specialties/${filename}`;
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the icon. Please try again.');
      }
    }

    // Create and save specialty
    const specialty = new Specialty({
      name: name.trim(),
      description: description ? description.trim() : null,
      headDoctorId: headDoctorId || null,
      icon: iconPath || '/public/images/specialties/default-specialty.jpg'
    });

    await specialty.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Specialty added successfully!' };
    res.redirect('/admin/manage_specialty');

  } catch (error) {
    console.error('Error adding specialty:', error);

    // Clean up uploaded file if exists
    if (iconPath) {
      try {
        const fullPath = path.join(__dirname, '../../', iconPath);
        await fs.unlink(fullPath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add specialty.' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit a specialty
router.get('/edit/:id', authAdmin, async (req, res) => {
    try {
        const specialtyId = req.params.id;
        
        // Get the specialty by id
        const specialty = await Specialty.findById(specialtyId);
        if (!specialty) {
            return res.status(404).render('error', {
                message: 'Specialty not found'
            });
        }
        
        // Get all doctors for the head doctor dropdown
        const doctors = await Doctor.findAllWithNames();
        
        // Get session data and clear it
        const { error, success } = req.session;
        req.session.error = null;
        req.session.success = null;
        
        // Prepare form data from session or from the specialty
        const formData = req.session.formData || {
            name: specialty.name,
            description: specialty.description,
            headDoctorId: specialty.headDoctorId
        };
        req.session.formData = null;
        
        res.render('vwAdmin/manage_specialty/edit_specialty', {
            title: 'Edit Specialty',
            specialty,
            error,
            success,
            formData,
            doctors: doctors.filter(d => d.accountStatus === 'active')
        });
    } catch (err) {
        console.error('Could not load the edit specialty form:', err);
        res.status(500).render('error', {
            message: 'Could not load the edit specialty form.'
        });
    }
});

// POST: Handle updating a specialty
router.post('/edit/:id', async function (req, res) {
  let iconPath = null;
  req.session.returnTo = `/admin/manage_specialty/edit/${req.params.id}`;
  
  try {
    const specialtyId = parseInt(req.params.id, 10);
    if (isNaN(specialtyId)) throw new Error('Invalid Specialty ID.');
    
    const { name, description, headDoctorId } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') throw new Error('Please enter the specialty name.');

    // Check uniqueness (excluding current ID)
    const isUnique = await Specialty.isNameUnique(name.trim(), specialtyId);
    if (!isUnique) {
      throw new Error(`Specialty name "${name.trim()}" already exists.`);
    }

    // Get current specialty
    const currentSpecialty = await Specialty.findById(specialtyId);
    if (!currentSpecialty) {
      throw new Error('Specialty not found for update.');
    }

    // --- File Upload Handling ---
    if (req.files && req.files.icon) {
      const icon = req.files.icon;
      
      // Check file type
      const fileExtension = path.extname(icon.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG or GIF files are allowed.');
      }
      
      // Check file size (2MB limit)
      if (icon.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB.');
      }
      
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `specialty-${safeName}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);
      
      try {
        await icon.mv(uploadPath);
        iconPath = `/public/images/specialties/${filename}`;
        
        // Delete old icon if it's not the default
        if (currentSpecialty.icon && 
            !currentSpecialty.icon.includes('default-specialty.jpg') && 
            fs.existsSync(path.join(__dirname, '../../', currentSpecialty.icon))) {
          await fs.unlink(path.join(__dirname, '../../', currentSpecialty.icon));
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the icon. Please try again.');
      }
    }

    // Update specialty with form data
    currentSpecialty.name = name.trim();
    currentSpecialty.description = description ? description.trim() : null;
    currentSpecialty.headDoctorId = headDoctorId || null;
    
    // Only update icon if a new one was uploaded
    if (iconPath) {
      currentSpecialty.icon = iconPath;
    }
    
    // Save the updated specialty
    await currentSpecialty.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Specialty updated successfully!' };
    res.redirect('/admin/manage_specialty');

  } catch (error) {
    console.error('Error updating specialty:', error);

    // Clean up uploaded file if there was an error and we uploaded a new file
    if (iconPath) {
      try {
        const fullPath = path.join(__dirname, '../../', iconPath);
        if (await fs.access(fullPath).then(() => true).catch(() => false)) {
          await fs.unlink(fullPath);
        }
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update specialty.' };
    res.redirect(req.session.returnTo);
  }
});

// DELETE: Handle deleting a specialty
router.delete('/delete/:id', async function (req, res) {
  try {
    const specialtyId = parseInt(req.params.id, 10);
    if (isNaN(specialtyId)) {
      return res.status(400).json({ success: false, message: 'Invalid Specialty ID' });
    }

    // Get specialty instance
    const specialty = await Specialty.findById(specialtyId);
    if (!specialty) {
      return res.status(404).json({ success: false, message: 'Specialty not found' });
    }

    // Check dependencies
    const dependencies = await specialty.checkDependencies();
    
    // Format dependency check results for the response
    const hasDependencies = dependencies.hasDoctors || 
                           dependencies.hasTechnicians ||
                           dependencies.hasServices ||
                           dependencies.hasRooms ||
                           dependencies.hasAppointments;
    
    if (hasDependencies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete this specialty because it is in use.',
        dependencies
      });
    }

    // If specialty has a custom icon, delete it
    if (specialty.icon && 
        !specialty.icon.includes('default-specialty.jpg') && 
        fs.existsSync(path.join(__dirname, '../../', specialty.icon))) {
      try {
        await fs.unlink(path.join(__dirname, '../../', specialty.icon));
      } catch (unlinkError) {
        console.error('Error deleting specialty icon:', unlinkError);
        // Continue with specialty deletion even if icon deletion fails
      }
    }

    // Delete the specialty
    const deleted = await specialty.delete();

    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete specialty' });
    }

    return res.json({ success: true, message: 'Specialty deleted successfully' });
  } catch (error) {
    console.error('Error deleting specialty:', error);
    return res.status(500).json({ success: false, message: error.message || 'An error occurred while deleting the specialty' });
  }
});

// API: Check if specialty name is unique
router.get('/check-name', async function (req, res) {
    const name = req.query.name;
    const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

    if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
    }

    try {
        const isUnique = await Specialty.isNameUnique(name, excludeId);
        res.json({ isUnique });
    } catch (error) {
        console.error('Error checking specialty name uniqueness:', error);
        res.status(500).json({ error: 'Failed to check name uniqueness' });
    }
});

export default router;