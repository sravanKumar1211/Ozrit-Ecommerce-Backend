import nodemailer from "nodemailer";

const sendEmail = async (
  email,
  subject,
  message
) => {
  try {
    const transporter =
      nodemailer.createTransport({
        service: "gmail",

        auth: {
          user:
            process.env.EMAIL_USER,

          pass:
            process.env.EMAIL_PASS,
        },
      });

    await transporter.sendMail({
      from:
        process.env.EMAIL_USER,

      to: email,

      subject,

      html: message,
    });

    console.log(
      "Email sent successfully"
    );
  } catch (error) {
    console.log(
      "Mail error:",
      error
    );
    throw error;
  }
};

export default sendEmail;