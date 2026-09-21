const nodemailer = require("nodemailer");

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.CONTACT_EMAIL,
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const sendContactEmail = async ({ name, phone, message, attachment }) => {
  if (!transporter) {
    console.warn("Contact email skipped: SMTP environment variables are not configured.");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER,
    subject: `New contact message from ${name}`,
    text: [`Name: ${name}`, `Phone: ${phone}`, "", message].join("\n"),
    html: `<h2>New contact message</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
    attachments: attachment
      ? [{ filename: attachment.originalname, path: attachment.path }]
      : [],
  });
};

module.exports = { sendContactEmail };
