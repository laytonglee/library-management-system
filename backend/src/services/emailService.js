const nodemailer = require("nodemailer");

function createTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback: log emails to console in development
  return null;
}

const FROM = process.env.EMAIL_FROM || "Library System <no-reply@library.local>";

async function sendMail({ to, subject, html, text }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}\n${text || html}`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html, text });
}

async function sendOverdueAlert({ to, fullName, bookTitle, dueDate, daysOverdue, fineAmount }) {
  await sendMail({
    to,
    subject: `Overdue Notice: "${bookTitle}"`,
    html: `<p>Dear ${fullName},</p>
<p>Your borrowed book <strong>"${bookTitle}"</strong> was due on <strong>${dueDate}</strong> and is now <strong>${daysOverdue} day(s) overdue</strong>.</p>
${fineAmount > 0 ? `<p>Accumulated fine: <strong>$${Number(fineAmount).toFixed(2)}</strong></p>` : ""}
<p>Please return the book as soon as possible to avoid further charges.</p>
<p>— Library Management System</p>`,
    text: `Dear ${fullName}, your book "${bookTitle}" was due on ${dueDate} and is ${daysOverdue} day(s) overdue.${fineAmount > 0 ? ` Fine: $${Number(fineAmount).toFixed(2)}.` : ""} Please return it promptly.`,
  });
}

async function sendPasswordReset({ to, fullName, resetUrl }) {
  await sendMail({
    to,
    subject: "Password Reset Request",
    html: `<p>Dear ${fullName},</p>
<p>You requested a password reset. Click the link below to set a new password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
<p>— Library Management System</p>`,
    text: `Dear ${fullName}, reset your password at: ${resetUrl}\nExpires in 1 hour.`,
  });
}

async function sendDueReminder({ to, fullName, bookTitle, dueDate }) {
  await sendMail({
    to,
    subject: `Due Soon: "${bookTitle}"`,
    html: `<p>Dear ${fullName},</p>
<p>This is a reminder that <strong>"${bookTitle}"</strong> is due on <strong>${dueDate}</strong>.</p>
<p>Please return or renew it on time to avoid overdue fines.</p>
<p>— Library Management System</p>`,
    text: `Dear ${fullName}, "${bookTitle}" is due on ${dueDate}. Please return or renew it on time.`,
  });
}

module.exports = { sendOverdueAlert, sendPasswordReset, sendDueReminder };
