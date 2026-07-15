import nodemailer from "nodemailer";

const sendInvoiceEmail = async ({
  to,
  userName,
  planName,
  amount,
  paymentId,
  orderId,
  watchLimit,
}) => {
  try {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.log("SMTP details missing. Invoice email skipped.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const invoiceNumber = `INV-${Date.now()}`;
    const currentDate = new Date().toLocaleString("en-IN");

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Streamify ${planName} Plan Invoice`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;border:1px solid #ddd;padding:20px;border-radius:10px;">
          <h2 style="margin-bottom:5px;">Streamify Plan Upgrade Invoice</h2>
          <p style="color:#555;">Thank you for upgrading your plan.</p>

          <hr />

          <h3>Invoice Details</h3>
          <p><b>Invoice Number:</b> ${invoiceNumber}</p>
          <p><b>Date:</b> ${currentDate}</p>
          <p><b>Name:</b> ${userName || "User"}</p>
          <p><b>Email:</b> ${to}</p>

          <h3>Plan Details</h3>
          <p><b>Selected Plan:</b> ${planName}</p>
          <p><b>Amount Paid:</b> ₹${amount}</p>
          <p><b>Watching Limit:</b> ${watchLimit}</p>

          <h3>Payment Details</h3>
          <p><b>Order ID:</b> ${orderId || "Demo Order"}</p>
          <p><b>Payment ID:</b> ${paymentId || "Demo Payment"}</p>

          <hr />

          <p style="font-size:13px;color:#666;">
            This is an auto-generated invoice email from Streamify.
          </p>
        </div>
      `,
    });

    console.log("Invoice email sent successfully");
  } catch (error) {
    console.log("Invoice email error:", error.message);
  }
};

export default sendInvoiceEmail;