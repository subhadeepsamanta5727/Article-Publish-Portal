const ContactSubmission = require("../models/ContactSubmission");
const { sendContactEmail } = require("../config/mailer");

const createContactSubmission = async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;
    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Name, phone number, and message are required." });
    }

    const submission = await ContactSubmission.create({
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
      attachmentName: req.file?.originalname || null,
      attachmentPath: req.file?.path || null,
    });

    try {
      await sendContactEmail({
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        attachment: req.file,
      });
    } catch (mailError) {
      console.error("Contact email delivery failed:", mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been received.",
      data: { submissionId: submission._id },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createContactSubmission };
