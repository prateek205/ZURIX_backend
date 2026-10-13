import nodemailer from "nodemailer";

const USER_EMAIL = process.env.GMAIL_USER;
const USER_PASSWORD = process.env.PASSWORD_APP_KEY;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: USER_EMAIL,
    pass: USER_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: USER_EMAIL,
    to,
    subject,
    html,
  });
};
