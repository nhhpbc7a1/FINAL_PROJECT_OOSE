import express from 'express';
import doctorService from '../../services/doctor.service.js';
import specialtyService from '../../services/specialty.service.js';
import userService from '../../services/user.service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises'; // Import fs promises for file deletion

// Định nghĩa __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/profile_images/');

const router = express.Router();

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
ensureUploadDirExists(); // Call it once when the router loads


router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'dashboard'; // Default route
    // Handle flash messages
    if (req.session.flashMessage) {
        res.locals.flashMessage = req.session.flashMessage;
        delete req.session.flashMessage; // Clear after displaying
    }
    next();
});

router.get('/',async function (_, res){
    res.locals.currentRoute = 'dashboard';
    res.redirect('/admin/dashboard');
});

// --- Doctor Management Routes ---

// GET: Display list of doctors
router.get('/manage_doctor', async function (req, res) {
  try {
    res.locals.currentRoute = 'doctors';
    // Check for flash messages
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    let doctors = await doctorService.findAll(); // Assuming this gets combined user/doctor data
    const specialties = await specialtyService.findAll();

    doctors = doctors.map(doctor => ({
      ...doctor,
      initials: doctor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      // Ensure profilePictureUrl is correctly mapped if needed
      profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png' // Example default
    }));

    res.render('vwAdmin/manage_doctor/doctor_list', {
      doctors,
      specialties,
      totalDoctors: doctors.length
    });
  } catch (error) {
    console.error('Error loading doctors:', error);
    res.render('vwAdmin/manage_doctor/doctor_list', { error: 'Failed to load doctors' });
  }
});

// GET: Display form to add a new doctor
router.get('/doctors/add', async function (req, res) {
  try {
    res.locals.currentRoute = 'doctors';
    res.locals.pageTitle = 'Add New Doctor';
    const specialties = await specialtyService.findAll();

    res.render('vwAdmin/manage_doctor/add_doctor', {
      specialties,
      doctor: {}, // Empty object for the form
      layout: 'admin' // Explicitly set layout if needed
    });
  } catch (error) {
    console.error('Error loading add doctor form:', error);
    // Add flash message for error redirection
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add doctor form.' };
    res.redirect('/admin/manage_doctor');
  }
});

// POST: Handle adding a new doctor
router.post('/doctors/add', async function (req, res) {
  let profileImagePath = null; // Define outside try block
  const specialties = await specialtyService.findAll(); // Fetch specialties upfront for error case

  try {
    const { fullName, email, phoneNumber, address, gender, dob, specialty,
            experience, education, certifications, licenseNumber, bio, accountStatus } = req.body;

    // --- File Upload Handling ---
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto;
      const timestamp = Date.now();
      const safeEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize email for filename
      const fileExtension = path.extname(profilePhoto.name); // Use path.extname
      const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);

      await profilePhoto.mv(uploadPath);
      profileImagePath = `/public/uploads/profile_images/${filename}`; // Relative path for web access
    }

    // --- Database Operations ---
    // 1. Create User
    // IMPORTANT: Hash password before saving in a real app! Using placeholder.
    const hashedPassword = await userService.hashPassword('password123'); // Example hashing
    const userData = {
        email,
        password: hashedPassword, // Store hashed password
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath,
        gender,
        dob: dob ? new Date(dob) : null, // Store as Date object
        roleId: 2, // Role ID for doctor
        accountStatus: accountStatus || 'active'
    };
    const newUser = await userService.add(userData); // Assume add returns the created user with ID

    if (!newUser || !newUser.userId) {
        throw new Error('Failed to create user account.');
    }

    // 2. Create Doctor Record
    const doctorData = {
        userId: newUser.userId,
        specialtyId: parseInt(specialty, 10), // Ensure specialty is integer
        licenseNumber,
        experience: parseInt(experience, 10), // Ensure experience is integer
        education,
        certifications,
        bio
    };
    await doctorService.add(doctorData);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Doctor added successfully!' };
    res.redirect('/admin/manage_doctor');

  } catch (error) {
    console.error('Error adding doctor:', error);

    // Optional: Clean up uploaded file if DB insert fails
    if (profileImagePath) {
      try {
        const fullPath = path.join(__dirname, '../../', profileImagePath); // Adjust path for deletion
        await fs.unlink(fullPath);
        console.log('Cleaned up uploaded file after error:', profileImagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    // --- Error Response ---
    res.locals.pageTitle = 'Add New Doctor'; // Set title again for render
    res.render('vwAdmin/manage_doctor/add_doctor', {
      specialties,
      doctor: req.body, // Keep submitted data to refill form
      error: 'Failed to add doctor. ' + error.message,
      layout: 'admin'
    });
  }
});

// GET: Display form to edit an existing doctor
router.get('/doctors/edit/:doctorId', async function (req, res) {
  try {
    res.locals.currentRoute = 'doctors';
    res.locals.pageTitle = 'Edit Doctor';
    const doctorId = parseInt(req.params.doctorId, 10);

    if (isNaN(doctorId)) {
        throw new Error('Invalid Doctor ID.');
    }

    // Fetch the combined doctor + user data using the doctorId
    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
      req.session.flashMessage = { type: 'danger', message: 'Doctor not found.' };
      return res.redirect('/admin/manage_doctor');
    }

    // Get the userId from the doctor record for later use
    const userId = doctor.userId;

    if (!userId) {
      req.session.flashMessage = { type: 'danger', message: 'User ID not found for this doctor.' };
      return res.redirect('/admin/manage_doctor');
    }

    const specialties = await specialtyService.findAll();

    // Format date for input type="date" (YYYY-MM-DD)
    let formattedDob = '';
    console.log("Original dob from database:", doctor.dob);

    // Try to format the date from dob field
    if (doctor.dob) {
        try {
            // MySQL DATE fields can sometimes be returned as strings in various formats
            // or as Date objects depending on the database driver
            let dobDate;

            if (doctor.dob instanceof Date) {
                // If it's already a Date object
                dobDate = doctor.dob;
            } else if (typeof doctor.dob === 'string') {
                // If it's a string, try to parse it
                // Handle MySQL date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(doctor.dob)) {
                    // MySQL date format (YYYY-MM-DD)
                    dobDate = new Date(doctor.dob + 'T00:00:00');
                } else {
                    // Try standard parsing
                    dobDate = new Date(doctor.dob);
                }
            }

            console.log("Parsed date object:", dobDate);

            if (!isNaN(dobDate)) {
                // Format as YYYY-MM-DD for HTML date input
                const year = dobDate.getFullYear();
                // Month is 0-indexed in JS Date, so add 1 and pad with leading zero if needed
                const month = String(dobDate.getMonth() + 1).padStart(2, '0');
                // Pad day with leading zero if needed
                const day = String(dobDate.getDate()).padStart(2, '0');

                formattedDob = `${year}-${month}-${day}`;
                console.log("Formatted dob for form:", formattedDob);
            } else {
                console.log("Invalid date - could not parse:", doctor.dob);
            }
        } catch (dateError) {
            console.error('Error formatting date of birth:', dateError);
        }
    } else {
        console.log("No dob value found in doctor object");
    }

    // Make sure specialty is correctly passed for the select dropdown
    res.render('vwAdmin/manage_doctor/edit_doctor', {
      specialties,
      doctor: {
          ...doctor,
          dob: formattedDob,
          dateOfBirth: doctor.dob, // Keep the original date for debugging
          specialty: doctor.specialtyId, // Ensure specialty is correctly mapped
          profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png'
      },
      layout: 'admin'
    });

    // Debug log to check what's being passed to the template
    console.log("Profile image path:", doctor.profileImage);

  } catch (error) {
    console.error('Error loading edit doctor form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_doctor');
  }
});

// POST: Handle updating an existing doctor
router.post('/doctors/update/:doctorId', async function (req, res) {
  const doctorId = parseInt(req.params.doctorId, 10);
  let profileImagePath = null; // To store new image path if uploaded
  let oldImagePath = null; // To store old image path for potential deletion
  const specialties = await specialtyService.findAll(); // Fetch upfront for error case

  if (isNaN(doctorId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Doctor ID.' };
      return res.redirect('/admin/manage_doctor');
  }

  // Get the userId from the form submission
  const userId = parseInt(req.body.userId, 10);

  if (isNaN(userId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid User ID in form submission.' };
      return res.redirect('/admin/manage_doctor');
  }

  try {
    const { fullName, email, phoneNumber, address, gender, dob, specialty,
            experience, education, certifications, licenseNumber, bio, accountStatus } = req.body;

    // 1. Fetch current user data to get existing image path
    const currentUser = await userService.findById(userId);
    if (!currentUser) {
        throw new Error('Doctor user account not found for update.');
    }
    oldImagePath = currentUser.profileImage; // Store the old path

    // --- File Upload Handling (if new file provided) ---
    if (req.files && req.files.profilePhoto) {
        const profilePhoto = req.files.profilePhoto;
        const timestamp = Date.now();
        const safeEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const fileExtension = path.extname(profilePhoto.name);
        const filename = `${safeEmailPrefix}_${timestamp}${fileExtension}`;
        const uploadPath = path.join(UPLOAD_DIR, filename);

        await profilePhoto.mv(uploadPath);
        profileImagePath = `/public/uploads/profile_images/${filename}`; // New path

        // Delete old image *after* successfully uploading new one (optional)
        if (oldImagePath && oldImagePath !== profileImagePath) {
            try {
                 const fullOldPath = path.join(__dirname, '../../', oldImagePath); // Adjust base path
                 await fs.unlink(fullOldPath);
                 console.log('Deleted old profile image:', oldImagePath);
             } catch (unlinkError) {
                  // Log error but don't stop the update process if deletion fails
                  console.error('Error deleting old profile image:', unlinkError);
             }
         }
    } else {
        // No new file uploaded, keep the old path
        profileImagePath = oldImagePath;
    }

    // --- Database Operations ---
    // 2. Update User Record
    const userData = {
        // email, // Generally avoid updating email easily, or add verification
        fullName,
        phoneNumber,
        address,
        profileImage: profileImagePath, // Use new path or preserved old path
        gender,
        dob: dob ? new Date(dob) : null,
        accountStatus: accountStatus || 'active'
        // DO NOT update password here without a specific password change mechanism
    };
    await userService.update(userId, userData);

    // 3. Update Doctor Record
    const doctorData = {
        specialtyId: parseInt(specialty, 10),
        licenseNumber,
        experience: parseInt(experience, 10),
        education,
        certifications,
        bio
    };

    try {
        // Use the updateByUserId method we just added to the doctor service
        const updated = await doctorService.updateByUserId(userId, doctorData);
        if (!updated) {
            throw new Error('Failed to update doctor-specific details.');
        }
    } catch (doctorUpdateError) {
        console.error('Error updating doctor record:', doctorUpdateError);
        throw new Error('Failed to update doctor details: ' + doctorUpdateError.message);
    }


    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Doctor updated successfully!' };
    res.redirect('/admin/manage_doctor');

  } catch (error) {
    console.error(`Error updating doctor (doctorId: ${doctorId}, userId: ${userId}):`, error);

    // --- Error Response ---
    // If update fails, DO NOT delete the old image even if a new one was uploaded momentarily
    // Re-render the edit form with the data the user tried to submit

    // We need to reconstruct the doctor object similar to the GET route for rendering
    // Fetch fresh data in case some partial update occurred or for consistency
     let doctorForForm = null;
     try {
         // Get the doctor data directly using doctorId
         doctorForForm = await doctorService.findById(doctorId);

         if (!doctorForForm) {
             // If not found, handle the error
             req.session.flashMessage = { type: 'danger', message: 'Doctor not found with this ID.' };
             return res.redirect('/admin/manage_doctor');
         }
     } catch(fetchErr) {
         // Handle case where fetching data even fails after an update attempt
         console.error('Error fetching doctor data after update attempt:', fetchErr);
         req.session.flashMessage = { type: 'danger', message: 'Error updating doctor and reloading data.' };
         return res.redirect('/admin/manage_doctor');
     }

     // Format DOB again for the form
     let formattedDob = '';
     if (doctorForForm && doctorForForm.dob) {
         try {
             const dobDate = new Date(doctorForForm.dob);
             if (!isNaN(dobDate)) formattedDob = dobDate.toISOString().split('T')[0];
         } catch (e) { /* ignore formatting error here */ }
     }

    res.locals.pageTitle = 'Edit Doctor'; // Set title again
    res.render('vwAdmin/manage_doctor/edit_doctor', {
      specialties,
      // Merge original doctor data (like ID, potentially unchanged email)
      // with the data submitted (req.body) to show what the user entered
      doctor: {
          ...doctorForForm, // Base with fetched data (includes ID, image)
          ...req.body,      // Override with submitted values
          doctorId: doctorId, // Ensure doctorId is present
          userId: userId,     // Ensure userId is present
          dob: req.body.dob || formattedDob, // Prioritize submitted dob format if valid
          profilePictureUrl: profileImagePath || oldImagePath || '/public/images/default-avatar.png' // Reflect potential new/old image
      },
      error: 'Failed to update doctor. ' + error.message,
      layout: 'admin'
    });
  }
});


// API endpoint for AJAX filtering/search (Keep as is)
router.get('/api/doctors', async function (req, res) {
  // ... (your existing API logic remains unchanged) ...
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filters
    const specialty = req.query.specialty || '';
    const status = req.query.status || '';
    const search = req.query.search || '';

    // Get all doctors (Consider optimizing this to fetch filtered/paginated data directly from DB)
    let doctors = await doctorService.findAll(); // This might become inefficient with many doctors


    // Apply filters if provided
    let filteredDoctors = doctors; // Start with all doctors
    if (specialty) {
      filteredDoctors = filteredDoctors.filter(doctor => doctor.specialtyId == specialty);
    }

    if (status) {
      // Ensure comparison is robust (e.g., handle case)
      filteredDoctors = filteredDoctors.filter(doctor => doctor.accountStatus && doctor.accountStatus.toLowerCase() === status.toLowerCase());
    }

    if (search) {
        const searchTerm = search.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doctor =>
            (doctor.fullName && doctor.fullName.toLowerCase().includes(searchTerm)) ||
            (doctor.email && doctor.email.toLowerCase().includes(searchTerm)) ||
            (doctor.licenseNumber && doctor.licenseNumber.toLowerCase().includes(searchTerm)) ||
            (doctor.specialtyName && doctor.specialtyName.toLowerCase().includes(searchTerm)) // Assuming specialtyName is available
      );
    }

    const filteredTotal = filteredDoctors.length;

    // Apply pagination *after* filtering
    const paginatedDoctors = filteredDoctors.slice(offset, offset + limit);

    // Add initials or other derived data
    const results = paginatedDoctors.map(doctor => ({
      ...doctor,
      initials: doctor.fullName ? doctor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??',
      profilePictureUrl: doctor.profileImage || '/public/images/default-avatar.png' // Consistent image URL
    }));

    // Return JSON response
    res.json({
      doctors: results,
      totalDoctors: filteredTotal, // Total *after* filtering
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        totalItems: filteredTotal
      }
    });
  } catch (error) {
    console.error('Error loading doctors via API:', error);
    res.status(500).json({ error: 'Failed to load doctors' });
  }
});

export default router;

