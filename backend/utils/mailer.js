const nodemailer = require("nodemailer");

/**
 * Dispatches password reset emails using configured SMTP transport
 * or provides graceful fallback for development and environments without SMTP credentials.
 */
const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"CollabDesk Security" <no-reply@collabdesk.internal>`,
        to,
        subject: "Password Reset Request — CollabDesk",
        html: `
          <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-bottom: 12px;">Reset Your CollabDesk Password</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5;">
              We received a request to reset your CollabDesk account password. Click the link below to choose a new password. This link will expire in 15 minutes.
            </p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.4;">
              If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
            </p>
          </div>
        `,
      });

      console.log(`[AUTH MAILER] Password reset email dispatched to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[AUTH MAILER] SMTP dispatch failed for ${to}:`, err.message);
      // Fall through to log for operational visibility
    }
  }

  // Graceful fallback for dev/test or when SMTP is not configured
  console.log(`[AUTH DISPATCH] Password reset link generated for ${to}: ${resetUrl}`);
  return { success: true, fallback: true };
};

module.exports = {
  sendPasswordResetEmail,
};
