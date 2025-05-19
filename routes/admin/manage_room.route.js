import express from 'express';
import Room from '../../models/Room.js';
import Specialty from '../../models/Specialty.js';

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

    // Get all rooms using the Room model
    const rooms = await Room.findAll();
    const specialties = await Specialty.findAll();

    res.render('vwAdmin/manage_room/room_list', {
      rooms,
      specialties,
      totalRooms: rooms.length
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
    const specialties = await Specialty.findAll();
    
    // Check for form data or flash message
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
      room: formData,
      error
    });
  } catch (error) {
    console.error('Error loading add room form:', error);
    req.session.flashMessage = { type: 'danger', message: 'Could not load the add room form.' };
    res.redirect('/admin/manage_room');
  }
});

// POST: Handle adding a new room
router.post('/add', async function (req, res) {
  req.session.returnTo = '/admin/manage_room/add';
  
  try {
    const { roomNumber, specialtyId, floor, description, status } = req.body;

    // Validation
    if (!roomNumber || !specialtyId) {
      throw new Error('Room number and specialty are required');
    }

    // Check if room number already exists
    const isUnique = await Room.isRoomNumberUnique(roomNumber);
    if (!isUnique) {
      throw new Error(`Room ${roomNumber} already exists`);
    }

    // Create a new Room instance
    const room = new Room({
      roomNumber,
      specialtyId: parseInt(specialtyId, 10),
      floor: floor || null,
      description: description || null,
      status: status || 'available'
    });

    // Save the room
    await room.save();

    // Success response
    req.session.flashMessage = { type: 'success', message: 'Room added successfully!' };
    res.redirect('/admin/manage_room');

  } catch (error) {
    console.error('Error adding room:', error);
    req.session.formData = req.body;
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not add room' };
    res.redirect(req.session.returnTo);
  }
});

// GET: Display form to edit a room
router.get('/edit/:roomId', async function (req, res) {
  try {
    res.locals.pageTitle = 'Edit Room';
    const roomId = parseInt(req.params.roomId, 10);

    if (isNaN(roomId)) {
      throw new Error('Invalid Room ID');
    }

    // Get the room using the Room model
    const room = await Room.findById(roomId);

    if (!room) {
      req.session.flashMessage = { type: 'danger', message: 'Room not found' };
      return res.redirect('/admin/manage_room');
    }

    const specialties = await Specialty.findAll();

    res.render('vwAdmin/manage_room/edit_room', {
      specialties,
      room
    });

  } catch (error) {
    console.error('Error loading edit room form:', error);
    req.session.flashMessage = { type: 'danger', message: error.message || 'Could not load the edit form' };
    res.redirect('/admin/manage_room');
  }
});

// POST: Handle updating a room
router.post('/update/:roomId', async function (req, res) {
  const roomId = parseInt(req.params.roomId, 10);

  if (isNaN(roomId)) {
    req.session.flashMessage = { type: 'danger', message: 'Invalid Room ID' };
    return res.redirect('/admin/manage_room');
  }

  try {
    const { roomNumber, specialtyId, floor, description, status } = req.body;

    // Validation
    if (!roomNumber || !specialtyId) {
      throw new Error('Room number and specialty are required');
    }

    // Get the room from the database
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if room number is being changed and if it would conflict with an existing room
    if (room.roomNumber !== roomNumber) {
      const isUnique = await Room.isRoomNumberUnique(roomNumber, roomId);
      if (!isUnique) {
        throw new Error(`Room ${roomNumber} already exists`);
      }
    }

    // Update room properties
    room.roomNumber = roomNumber;
    room.specialtyId = parseInt(specialtyId, 10);
    room.floor = floor || null;
    room.description = description || null;
    room.status = status || 'available';

    // Save the updated room
    await room.save();

    // Success response
    req.session.flashMessage = { type: 'success', message: 'Room updated successfully!' };
    res.redirect('/admin/manage_room');

  } catch (error) {
    console.error(`Error updating room (roomId: ${roomId}):`, error);
    req.session.flashMessage = { type: 'danger', message: error.message || 'Failed to update room' };
    res.redirect(`/admin/manage_room/edit/${roomId}`);
  }
});

// DELETE: Handle room deletion
router.delete('/delete/:roomId', async function (req, res) {
  try {
    const roomId = parseInt(req.params.roomId, 10);

    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid Room ID' });
    }

    // Get the room first to check if it exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if the room is in use in any appointments
    const isInUse = await Room.checkDependencies(roomId);
    if (isInUse) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete room because it is in use in appointments or schedules'
      });
    }

    // Delete the room
    const deleted = await room.delete();

    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete room' });
    }

    return res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error(`Error deleting room:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the room'
    });
  }
});

// API: Check if room number is unique
router.get('/check-room-number', async function (req, res) {
  const roomNumber = req.query.roomNumber;
  const excludeId = req.query.excludeId ? parseInt(req.query.excludeId, 10) : null;

  if (!roomNumber) {
    return res.status(400).json({ error: 'Room number parameter is required' });
  }

  try {
    const isUnique = await Room.isRoomNumberUnique(roomNumber, excludeId);
    res.json({ isUnique });
  } catch (error) {
    console.error('Error checking room number uniqueness:', error);
    res.status(500).json({ error: 'Failed to check room number uniqueness' });
  }
});

export default router;