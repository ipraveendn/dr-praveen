import express from 'express';
import {
  getBookingDates,
  getAvailability,
  bookAppointment,
  cancelAppointment,
  getAppointments
} from '../controllers/appointmentController.js';

const router = express.Router();

// Public Appointment Booking Routes
router.get('/dates', getBookingDates);
router.get('/availability', getAvailability);
router.post('/book', bookAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.get('/', getAppointments);

export default router;
