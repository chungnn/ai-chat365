const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth'); // Middleware for authentication

/*
 * Public routes - no authentication required
 */
// Submit customer satisfaction rating
router.post('/:ticketId/satisfaction', ticketController.submitSatisfactionRating);

/*
 * Protected routes - authentication required (for agents)
 */
// Update ticket status
router.put('/:ticketId/status', auth, ticketController.updateTicketStatus);

// Update ticket priority
router.put('/:ticketId/priority', auth, ticketController.updateTicketPriority);

// Assign ticket to agent
router.put('/:ticketId/assign', auth, ticketController.assignTicket);

// Update ticket category
router.put('/:ticketId/category', auth, ticketController.updateTicketCategory);

/*
 * Admin routes - admin authentication required
 */
// Get all tickets with filtering and pagination
router.get('/', auth, ticketController.getTickets);

// Get ticket statistics for dashboard
router.get('/stats', auth, ticketController.getTicketStats);

module.exports = router;
