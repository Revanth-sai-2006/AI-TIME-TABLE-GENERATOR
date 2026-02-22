const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─── Resend (HTTP API — preferred: works on Render/Vercel, no SMTP ports needed) ──
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_')) return null;
  return new Resend(process.env.RESEND_API_KEY);
};

// ─── Nodemailer SMTP fallback (local dev only) ────────────────────────────────
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD ||
      process.env.EMAIL_APP_PASSWORD.includes('PASTE') ||
      process.env.EMAIL_APP_PASSWORD.includes('your_')) {
    return null;
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4,                // force IPv4
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Send course registration confirmation email to a student.
 * @param {Object} opts
 * @param {string} opts.studentEmail
 * @param {string} opts.studentName
 * @param {string} opts.courseCode
 * @param {string} opts.courseName
 * @param {number} opts.credits
 * @param {string} opts.department
 * @param {number} opts.semester
 */
const sendRegistrationConfirmation = async ({
  studentEmail,
  studentName,
  courseCode,
  courseName,
  credits,
  department,
  semester,
}) => {
  const resend = getResendClient();
  const transporter = !resend ? createTransporter() : null;

  if (!resend && !transporter) {
    logger.warn('Email not configured — set RESEND_API_KEY (recommended) or EMAIL_USER + EMAIL_APP_PASSWORD.');
    return;
  }

  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const time = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Course Registration Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6b1a24 0%,#3a0d13 100%);padding:32px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:rgba(245,222,146,0.85);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Government University Academic Portal</p>
              <h1 style="margin:6px 0 0;color:#f5de92;font-size:24px;font-weight:800;letter-spacing:1px;">TimetableGen AMIS</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:12px;letter-spacing:2px;text-transform:uppercase;">NEP 2020 · AICTE Compliant</p>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td align="center" style="padding:28px 36px 0;">
              <div style="display:inline-block;background:#d1fae5;border:1.5px solid #6ee7b7;border-radius:50px;padding:8px 22px;">
                <span style="color:#059669;font-weight:700;font-size:13px;">✓ &nbsp;Registration Successful</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 36px 12px;">
              <p style="margin:0 0 18px;color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                You have successfully registered for the following course. Your personalised timetable has been updated accordingly.
              </p>

              <!-- Course card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#faf5eb;border:1.5px solid #e8b83a33;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92400e;">Course Details</p>
                    <h2 style="margin:6px 0 2px;font-size:20px;color:#1f2937;">${courseCode}</h2>
                    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;font-weight:600;">${courseName}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:3px 16px 3px 0;color:#6b7280;font-size:13px;">Department</td>
                        <td style="padding:3px 0;color:#1f2937;font-weight:600;font-size:13px;">${department}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 16px 3px 0;color:#6b7280;font-size:13px;">Semester</td>
                        <td style="padding:3px 0;color:#1f2937;font-weight:600;font-size:13px;">${semester}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 16px 3px 0;color:#6b7280;font-size:13px;">Credits</td>
                        <td style="padding:3px 0;color:#1f2937;font-weight:600;font-size:13px;">${credits}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 16px 3px 0;color:#6b7280;font-size:13px;">Registered On</td>
                        <td style="padding:3px 0;color:#1f2937;font-weight:600;font-size:13px;">${date} at ${time}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#6b7280;font-size:13px;line-height:1.6;">
                Log in to the portal to view your complete personalised timetable, drop courses, or register for additional subjects before the deadline.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#6b1a24,#3a0d13);border-radius:8px;padding:13px 28px;">
                    <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/student"
                      style="color:#f5de92;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.5px;">
                      View My Timetable →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">This is an automated message — please do not reply.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                © 2025–26 TimetableGen AMIS &nbsp;·&nbsp; NEP 2020 &amp; AICTE Compliant<br/>
                Developed by <strong style="color:#6b7280;">Vedantam Revanth Sai</strong> · Roll No. 2300031900
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    if (resend) {
      // ── Resend HTTP API (works on Render / any host — no SMTP ports needed) ──
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      await resend.emails.send({
        from: `TimetableGen AMIS <${fromAddress}>`,
        to: [studentEmail],
        subject: `✅ Registered for ${courseCode} – ${courseName}`,
        html,
      });
    } else {
      // ── Nodemailer Gmail SMTP (local dev fallback) ──
      await transporter.sendMail({
        from: `"TimetableGen AMIS" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `✅ Registered for ${courseCode} – ${courseName}`,
        html,
      });
    }
    logger.info(`✅ Registration email sent → ${studentEmail} for ${courseCode}`);
  } catch (err) {
    // Email failure must never break the registration flow
    logger.error(`Failed to send registration email to ${studentEmail}: ${err.message}`);
  }
};

module.exports = { sendRegistrationConfirmation };
