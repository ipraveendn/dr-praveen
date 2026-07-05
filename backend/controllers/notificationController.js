import { sendWhatsApp } from '../utils/smsService.js'

export async function sendWhatsAppConfirmation(req, res) {
  try {
    const {
      phone,
      patientName,
      appointmentDate,
      collectionAddress,
      selectedTests,
      selectedPackageName,
      totalAmount,
      reportAccess,
      collectionType
    } = req.body

    if (!phone || !appointmentDate || !collectionAddress || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking details. Please provide phone, appointment date, collection address, and total amount.'
      })
    }

    const bookingDetails = selectedPackageName
      ? `Package: ${selectedPackageName}`
      : `Tests: ${selectedTests || 'Not specified'}`

    const message = `Thank you for booking your laboratory test with Dr. Praveen Ramachandra.\n\nYour appointment is confirmed.\n\nAppointment Date: ${appointmentDate}\nCollection Type: ${collectionType || 'Home collection'}\nCollection Address: ${collectionAddress}\nReport Access: ${reportAccess || 'Email'}\n${bookingDetails}\nTotal Amount: ₹${totalAmount}\n\nWe will contact you if there are any changes to your appointment.\n\n- Dr. Praveen Ramachandra`;

    const result = await sendWhatsApp(phone, message)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send WhatsApp confirmation.',
        details: result
      })
    }

    return res.status(200).json({
      success: true,
      message: 'WhatsApp confirmation sent successfully.',
      data: result.data
    })
  } catch (error) {
    console.error('[NOTIFICATION CONTROLLER] Error sending WhatsApp confirmation:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error while sending WhatsApp confirmation.',
      error: error.message
    })
  }
}
