import express from 'express';
import Patient from '../../models/Patient.js';
import User from '../../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import multer from 'multer';

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/profile_images/');

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
    res.locals.currentRoute = 'patients'; // Set current route highlight
    next();
});

// GET: Display list of patients
router.get('/', async function (req, res) {
  try {
    // Check for flash messages
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    // Get all patients using the Patient model
    const patients = await Patient.findAll();

    // Enhancement: Format data for display
    const formattedPatients = patients.map(patient => ({
      ...patient,
      initials: patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      profilePictureUrl: patient.profileImage || '/public/images/default-avatar.png',
      formattedDob: patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'
    }));

    res.render('vwAdmin/manage_patient/patient_list', {
      patients: formattedPatients,
      totalPatients: patients.length
    });
  } catch (error) {
    console.error('Error loading patients:', error);
    res.render('vwAdmin/manage_patient/patient_list', { error: 'Failed to load patients' });
  }
});

// GET: Display form to add a new patient
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Patient';
    
    // Get session data if exists
    let formData = req.session.formData || {};
    req.session.formData = null;
    
    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_patient/add_patient', {
      patient: formData,
      error
    });
  } catch (error) {
    console.error('Error loading add patient form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add patient form.' };
    res.redirect('/admin/manage_patient');
  }
});

// POST: Handle adding a new patient
router.post('/add', async function (req, res) {
  let profileImagePath = null;
  req.session.returnTo = '/admin/manage_patient/add';
  
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      address, 
      gender, 
      dob, 
      healthInsuranceNumber,
      emergencyContactName,
      emergencyContactPhone,
      bloodType,
      allergies,
      medicalHistory,
      accountStatus
    } = req.body;

    // --- Validation ---
    if (!email || !fullName) {
      throw new Error('Email and full name are required');
    }

    // --- File Upload Handling ---
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto;
      
      // Check file type
      const fileExtension = path.extname(profilePhoto.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Only JPG, JPEG, PNG or GIF files are allowed');
      }
      
      // Check file size (5MB limit)
      if (profilePhoto.size > 5 * 1024 * 1024) {
        throw new Error('File size cannot exceed 5MB');
      }
      
      const timestamp = Date.now();
      const safeEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize email for filename
      const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);
      
      try {
        await profilePhoto.mv(uploadPath);
        profileImagePath = `/public/uploads/profile_images/${filename}`;
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload the profile photo. Please try again.');
      }
    }

    // --- Database Operations ---
    // 1. Create User
    const defaultPassword = 'password123'; // In a real app, consider generating a random password
    const hashedPassword = await User.hashPassword(defaultPassword);

    const userData = {
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      address,
      profileImage: profileImagePath,
      gender,
      dob: dob ? new Date(dob) : null,
      roleId: 3, // Role ID for patient
      accountStatus: accountStatus || 'active'
    };
    
    const newUser = new User(userData);
    await newUser.save();

    if (!newUser || !newUser.userId) {
      throw new Error('Failed to create user account');
    }

    // 2. Create Patient Record
    const patientData = {
      userId: newUser.userId,
      healthInsuranceNumber,
      emergencyContactName,
      emergencyContactPhone,
      bloodType,
      allergies,
      medicalHistory
    };
    
    // Create a new Patient instance and save it
    const patient = new Patient(patientData);
    await patient.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Patient added successfully!' };
    res.redirect('/admin/manage_patient');

  } catch (error) {
    console.error('Error adding patient:', error);

    // Clean up uploaded file if there was an error
    if (profileImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', profileImagePath);
        await fs.unlink(fullPath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add patient' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit an existing patient
router.get('/edit/:patientId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Patient';
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      throw new Error('Invalid Patient ID');
    }

    // Fetch the patient by ID using the Patient model
    const patient = await Patient.findById(patientId);

    if (!patient) {
      req.session.flashMessage = { type: 'danger', message: 'Patient not found' };
      return res.redirect('/admin/manage_patient');
    }

    // Format date for input type="date" (YYYY-MM-DD)
    let formattedDob = '';
    if (patient.dob) {
      try {
        const dobDate = new Date(patient.dob);
        if (!isNaN(dobDate)) {
          const year = dobDate.getFullYear();
          const month = String(dobDate.getMonth() + 1).padStart(2, '0');
          const day = String(dobDate.getDate()).padStart(2, '0');
          formattedDob = `${year}-${month}-${day}`;
        }
      } catch (dateError) {
        console.error('Error formatting date of birth:', dateError);
      }
    }

    res.render('vwAdmin/manage_patient/edit_patient', {
      patient: {
        ...patient,
        dob: formattedDob,
        profilePictureUrl: patient.profileImage || '/public/images/default-avatar.png'
      }
    });

  } catch (error) {
    console.error('Error loading edit patient form:', error);
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not load the edit form' };
    res.redirect('/admin/manage_patient');
  }
});

// POST: Handle updating an existing patient
router.post('/update/:patientId', async function (req, res) {
  const patientId = parseInt(req.params.patientId, 10);
  let profileImagePath = null;
  let oldImagePath = null;

  if (isNaN(patientId)) {
    req.session.flashMessage = { type: 'danger', message: 'Invalid Patient ID' };
    return res.redirect('/admin/manage_patient');
  }

  try {
    const { 
      userId,
      fullName, 
      phoneNumber, 
      address, 
      gender, 
      dob, 
      healthInsuranceNumber,
      emergencyContactName,
      emergencyContactPhone,
      bloodType,
      allergies,
      medicalHistory,
      accountStatus
    } = req.body;

    // Verify the patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // 1. Fetch current user data to get existing image path
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('Patient user account not found');
    }
    oldImagePath = currentUser.profileImage;

    // --- File Upload Handling (if new file provided) ---
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto;
      const timestamp = Date.now();
      const fileExtension = path.extname(profilePhoto.name);
      const safeNamePrefix = fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeNamePrefix}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await profilePhoto.mv(uploadPath);
      profileImagePath = `/public/uploads/profile_images/${filename}`;

      // Delete old image (if it's not the default)
      if (oldImagePath && !oldImagePath.includes('default-avatar')) {
        try {
          const fullOldPath = path.join(__dirname, '../../', oldImagePath);
          await fs.access(fullOldPath);
          await fs.unlink(fullOldPath);
        } catch (unlinkError) {
          console.error('Error deleting old profile image:', unlinkError);
        }
      }
    }

    // --- Update Patient Data ---
    // Update patient properties
    patient.healthInsuranceNumber = healthInsuranceNumber;
    patient.emergencyContactName = emergencyContactName;
    patient.emergencyContactPhone = emergencyContactPhone;
    patient.bloodType = bloodType;
    patient.allergies = allergies;
    patient.medicalHistory = medicalHistory;
    
    // Update user-related properties
    patient.fullName = fullName;
    patient.phoneNumber = phoneNumber;
    patient.address = address;
    patient.gender = gender;
    patient.dob = dob ? new Date(dob) : null;
    patient.accountStatus = accountStatus;
    if (profileImagePath) {
      patient.profileImage = profileImagePath;
    }
    
    // Save the updated patient
    await patient.save();

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Patient updated successfully!' };
    res.redirect('/admin/manage_patient');

  } catch (error) {
    console.error(`Error updating patient (patientId: ${patientId}):`, error);

    // If a new image was uploaded but update failed, clean it up
    if (profileImagePath && profileImagePath !== oldImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', profileImagePath);
        await fs.unlink(fullPath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    req.session.flashMessage = { type: 'danger', message: error.message || 'Failed to update patient' };
    res.redirect(`/admin/manage_patient/edit/${patientId}`);
  }
});

// GET: View patient details
router.get('/view/:patientId', async function (req, res) {
    try {
    res.locals.pageTitle = 'Patient Details';
        const patientId = parseInt(req.params.patientId, 10);

        if (isNaN(patientId)) {
      throw new Error('Invalid Patient ID');
        }

    // Get patient with appointments
    const patient = await Patient.getPatientWithAppointments(patientId);

        if (!patient) {
      req.session.flashMessage = { type: 'danger', message: 'Patient not found' };
      return res.redirect('/admin/manage_patient');
        }

    // Format dates and add computed properties
    const formattedPatient = {
             ...patient,
      formattedDob: patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A',
      age: patient.dob ? calculateAge(patient.dob) : 'N/A',
             profilePictureUrl: patient.profileImage || '/public/images/default-avatar.png',
      // Format appointments
      appointments: patient.appointments.map(appt => ({
        ...appt,
        formattedDate: new Date(appt.appointmentDate).toLocaleDateString(),
        statusClass: getStatusClass(appt.status)
      }))
    };

        res.render('vwAdmin/manage_patient/view_patient', {
      patient: formattedPatient
        });

    } catch (error) {
    console.error('Error loading patient details:', error);
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not load patient details' };
    res.redirect('/admin/manage_patient');
  }
});

// DELETE: Handle patient deletion (or deactivation)
router.delete('/delete/:patientId', async function (req, res) {
  try {
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid Patient ID' });
    }

    // Get the patient with the Patient model
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Deactivate the user account
    const userToUpdate = await User.findById(patient.userId);
    userToUpdate.accountStatus = 'inactive';
    userToUpdate.email = `${patient.email}_deactivated_${Date.now()}`;
    await userToUpdate.save();
    
    // Return success response
    return res.json({
      success: true,
      message: 'Patient account deactivated successfully'
    });

  } catch (error) {
    console.error(`Error deactivating patient:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deactivating the patient'
    });
  }
});

// Helper function to calculate age from date of birth
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to get CSS class for appointment status
function getStatusClass(status) {
  const statusMap = {
    'pending': 'bg-warning text-dark',
    'confirmed': 'bg-success text-white',
    'completed': 'bg-info text-white',
    'cancelled': 'bg-danger text-white',
    'no-show': 'bg-secondary text-white'
  };
  
  return statusMap[status.toLowerCase()] || 'bg-light';
}

export default router;