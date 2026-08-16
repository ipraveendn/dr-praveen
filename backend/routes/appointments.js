import express from 'express';
import {
  getBookingDates,
  getAvailability,
  getTodaySlots,
  bookAppointment,
  adminBookTodayAppointment,
  cancelAppointment,
  getAppointments
} from '../controllers/appointmentController.js';

const router = express.Router();

// Public & Admin Appointment Booking Routes
router.get('/dates', getBookingDates);
router.get('/availability', getAvailability);
router.get('/today-slots', getTodaySlots);
router.get('/admin/today-slots', getTodaySlots);
router.post('/book', bookAppointment);
router.post('/book-today', adminBookTodayAppointment);
router.post('/admin/book-today', adminBookTodayAppointment);
router.patch('/:id/cancel', cancelAppointment);
router.get('/', getAppointments);

export default router;

