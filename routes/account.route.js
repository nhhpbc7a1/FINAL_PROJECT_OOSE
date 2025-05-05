import express from 'express';
import userService from '../services/user.service.js';

const router = express.Router();

router.get('/is-available-email', async function (req, res) {
    const email = req.query.email;
    // Get the userId we might need to exclude (for editing scenarios)
    const excludeUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    // Basic validation: If email is empty, treat it as 'available' for this check
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.json(true); // Don't flag empty email as unavailable
    }

    // Validate email format (basic) - prevent unnecessary DB lookups
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Invalid format, treat as 'unavailable' to prevent submission
        // Or return a specific error if needed by frontend
        return res.json(false);
    }


    try {
        const user = await userService.findByEmail(email.trim()); // Trim whitespace

        if (user) {
            // Email exists in the database
            if (excludeUserId && user.userId === excludeUserId) {
                // The email belongs to the user currently being edited, so it's 'available' for them to keep.
                return res.json(true);
            } else {
                // The email exists and belongs to a DIFFERENT user (or we are in 'add' mode with no excludeUserId).
                return res.json(false); // Not available
            }
        } else {
            // Email does not exist in the database.
            return res.json(true); // Available
        }
    } catch (error) {
        console.error("Error checking email availability:", error);
        // On server error, conservatively return false to prevent potential duplicates
        return res.status(500).json(false);
    }
});

router.get('/login', async function (req, res) {
    res.render('login');
});

router.get('/signup', async function (req, res) {
    res.render('signup');
});

export default router;