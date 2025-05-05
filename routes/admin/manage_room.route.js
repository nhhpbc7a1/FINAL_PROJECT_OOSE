import express from 'express';
import roomService from '../../services/room.service.js';
import specialtyService from '../../services/specialty.service.js'; // Needed for dropdown

const router = express.Router();

// Middleware for layout and current route
router.use((req, res, next) => {
    res.locals.layout = 'admin';
    res.locals.currentRoute = 'rooms'; // Set current route highlight
    next();
});

// GET: Display list of rooms
router.get('/', async function (req, res) {
  try {
    const flashMessage = req.session.flashMessage;
    if (flashMessage) {
      res.locals.flashMessage = flashMessage;
      delete req.session.flashMessage;
    }

    const searchQuery = req.query.search || '';
    let rooms;
    if (searchQuery) {
        rooms = await roomService.search(searchQuery);
    } else {
        rooms = await roomService.findAll(true); // Include all statuses
    }

    res.render('vwAdmin/manage_room/room_list', {
      rooms,
      totalRooms: rooms.length,
      searchQuery
    });
  } catch (error) {
    console.error('Error loading rooms:', error);
    res.render('vwAdmin/manage_room/room_list', { error: 'Failed to load rooms' });
  }
});

// GET: Display form to add a new room
router.get('/add', async function (req, res) {
  try {
    res.locals.pageTitle = 'Add New Room';
    const specialties = await specialtyService.findAll(); // For dropdown

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

    res.render('vwAdmin/manage_room/add_room', {
      specialties,
      room: formData, // Repopulate form on error
      error
    });
  } catch (error) {
    console.error('Error loading add room form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add room form.' };
    res.redirect('/admin/manage_room');
  }
});

// POST: Handle adding a new room
router.post('/add', async function (req, res, next) {
  req.session.returnTo = '/admin/manage_room/add';

  try {
    const { roomNumber, specialtyId, capacity, roomType, status, description } = req.body;

    // --- Validation ---
    if (!roomNumber || roomNumber.trim() === '') throw new Error('Please enter the room number.');
    if (!roomType) throw new Error('Please select a room type.');
    // Further validation happens in the service (ENUMs, capacity format)

    // Check uniqueness
    const isUnique = await roomService.isRoomNumberUnique(roomNumber.trim());
    if (!isUnique) {
        throw new Error(`Room number "${roomNumber.trim()}" already exists.`);
    }

    // --- Prepare Data (Service will handle parsing/defaults) ---
    const roomData = {
        roomNumber: roomNumber.trim(),
        specialtyId: specialtyId || null,
        capacity: capacity || null,
        roomType: roomType,
        status: status || 'available',
        description: description ? description.trim() : null
    };

    // --- Database Operation ---
    await roomService.add(roomData);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Room added successfully!' };
    res.redirect('/admin/manage_room');

  } catch (error) {
    console.error('Error adding room:', error);
    req.session.formData = req.body; // Save form data
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add room.' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit an existing room
router.get('/edit/:roomId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Room';
    const roomId = parseInt(req.params.roomId, 10);

    if (isNaN(roomId)) throw new Error('Invalid Room ID.');

    const room = await roomService.findById(roomId);
    if (!room) {
      req.session.flashMessage = { type: 'danger', message: 'Room not found.' };
      return res.redirect('/admin/manage_room');
    }

    const specialties = await specialtyService.findAll(); // For dropdown

    let error = null;
    if (req.session.flashMessage && req.session.flashMessage.type === 'danger') {
      error = req.session.flashMessage.message;
      delete req.session.flashMessage;
    }

    res.render('vwAdmin/manage_room/edit_room', {
      room,
      specialties,
      error
    });

  } catch (error) {
    console.error('Error loading edit room form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the edit form. ' + error.message };
    res.redirect('/admin/manage_room');
  }
});

// POST: Handle updating an existing room
router.post('/update/:roomId', async function (req, res, next) {
  const roomId = parseInt(req.params.roomId, 10);
  req.session.returnTo = `/admin/manage_room/edit/${roomId}`;

  if (isNaN(roomId)) {
      req.session.flashMessage = { type: 'danger', message: 'Invalid Room ID.' };
      return res.redirect('/admin/manage_room');
  }

  try {
     const { roomNumber, specialtyId, capacity, roomType, status, description } = req.body;

    // --- Validation ---
    if (!roomNumber || roomNumber.trim() === '') throw new Error('Please enter the room number.');
    if (!roomType) throw new Error('Please select a room type.');
    if (!status) throw new Error('Please select a status.');
     // Further validation in service (ENUMs, capacity format)


    // Check uniqueness (excluding current ID)
    const isUnique = await roomService.isRoomNumberUnique(roomNumber.trim(), roomId);
    if (!isUnique) {
        throw new Error(`Room number "${roomNumber.trim()}" already exists.`);
    }

    // --- Prepare Data ---
    const roomData = {
        roomNumber: roomNumber.trim(),
        specialtyId: specialtyId || null, // Send null if empty string
        capacity: capacity || null,
        roomType: roomType,
        status: status,
        description: description ? description.trim() : null
    };

    // --- Database Operation ---
    const updated = await roomService.update(roomId, roomData);

    // --- Success Response ---
    req.session.flashMessage = { type: 'success', message: 'Room updated successfully!' };
    res.redirect('/admin/manage_room');

  } catch (error) {
    console.error(`Error updating room ID ${roomId}:`, error);
    req.session.formData = req.body; // Save potentially incorrect data
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not update room.' };
    res.redirect(req.session.returnTo); // Redirect back to edit form
  }
});


// DELETE: Handle room deletion
router.delete('/delete/:roomId', async function (req, res) {
  try {
    const roomId = parseInt(req.params.roomId, 10);

    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid Room ID' });
    }

    // *** CRUCIAL: Dependency Check ***
    const hasDependencies = await roomService.checkDependencies(roomId);

    if (hasDependencies) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete room. It is currently associated with schedules, appointments, or test results. Please clear these associations first.'
        });
    }

    // If checks pass, proceed with deletion
    const deleted = await roomService.delete(roomId);

    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Room not found or already deleted.' });
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Room deleted successfully',
      roomId: roomId
    });

  } catch (error) {
    console.error(`Error deleting room:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the room.'
    });
  }
});

// API endpoint for AJAX room number uniqueness check
router.get('/api/check-number', async (req, res) => {
     const roomNumber = req.query.roomNumber;
     const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

     if (!roomNumber) {
         return res.status(400).json({ isUnique: false, message: 'Room Number parameter is required.' });
     }

     try {
         const isUnique = await roomService.isRoomNumberUnique(roomNumber, excludeId);
         res.json({ isUnique });
     } catch (error) {
         console.error("API Check Room Number Error:", error);
         res.status(500).json({ isUnique: false, message: 'Server error checking room number.' });
     }
 });


export default router;