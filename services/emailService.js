import sendEmail from "../utils/sendEmail.js";

// Helper to wrap message body in a beautiful, premium responsive HTML template
const getEmailWrapper = (title, preheader, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f172a;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 32px;
    }
    .content h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .content p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.15);
    }
    .divider {
      height: 1px;
      background-color: #f1f5f9;
      margin: 32px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      font-size: 12px;
      color: #94a3b8;
      margin: 4px 0;
    }
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 14px;
    }
    .order-table th {
      text-align: left;
      padding: 8px 12px;
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }
    .order-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .order-totals {
      width: 100%;
      margin-top: 16px;
      text-align: right;
      font-size: 14px;
    }
    .order-totals td {
      padding: 6px 12px;
    }
    .order-totals tr.total {
      font-weight: bold;
      font-size: 16px;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-paid { background-color: #ecfdf5; color: #065f46; }
    .badge-pending { background-color: #fffbeb; color: #92400e; }
    .badge-failed { background-color: #fef2f2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Ozrit Shop</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Ozrit Shop. All rights reserved.</p>
        <p>123 Commerce Way, Tech Suite 500, India</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Render a dynamic table of items in an order
const renderOrderItemsTable = (order) => {
  if (!order.OrderItems || order.OrderItems.length === 0) return "";

  let rows = order.OrderItems.map(item => `
    <tr>
      <td>
        <strong>${item.Product?.name || "Product"}</strong>
        ${item.ProductVariant ? `<br/><span style="font-size:12px;color:#64748b;">${[item.ProductVariant.color, item.ProductVariant.size].filter(Boolean).join(" / ")}</span>` : ""}
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
      <td style="text-align: right;">₹${parseFloat(item.totalPrice).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <table class="order-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Price</th>
          <th style="text-align: right; width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

// Render pricing totals breakdown
const renderOrderTotals = (order) => `
  <table class="order-totals" align="right">
    <tr>
      <td style="color:#64748b;">Subtotal:</td>
      <td style="width: 120px; font-weight: 500;">₹${parseFloat(order.totalAmount).toFixed(2)}</td>
    </tr>
    ${order.discountAmount > 0 ? `
    <tr>
      <td style="color:#10b981;">Discount:</td>
      <td style="color:#10b981; font-weight: 500;">-₹${parseFloat(order.discountAmount).toFixed(2)}</td>
    </tr>` : ""}
    <tr class="total">
      <td>Total Amount:</td>
      <td>₹${parseFloat(order.finalAmount).toFixed(2)}</td>
    </tr>
  </table>
  <div style="clear: both;"></div>
`;

// Render payment information block
const renderPaymentDetails = (order) => {
  const isPaid = order.paymentStatus === "paid";
  return `
    <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; margin-top: 24px; border: 1px solid #e2e8f0; font-size: 14px;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 600;">Payment Summary</h3>
      <div style="margin-bottom: 8px;">
        <span style="color:#64748b;">Method:</span> 
        <strong style="color:#0f172a; text-transform: uppercase;">${order.paymentMethod || "Razorpay"}</strong>
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color:#64748b;">Status:</span> 
        <span class="badge badge-${order.paymentStatus}">${order.paymentStatus}</span>
      </div>
      ${order.razorpayPaymentId ? `
      <div style="margin-bottom: 8px;">
        <span style="color:#64748b;">Transaction ID:</span> 
        <code style="color:#0f172a; font-family: monospace;">${order.razorpayPaymentId}</code>
      </div>` : ""}
      ${order.paidAt ? `
      <div>
        <span style="color:#64748b;">Paid On:</span> 
        <strong style="color:#0f172a;">${new Date(order.paidAt).toLocaleString("en-IN")}</strong>
      </div>` : ""}
    </div>
  `;
};

// ─── USER NOTIFICATIONS ──────────────────────────────────────────────────────

export const sendVerificationOtpEmail = async (user, otp) => {
  const subject = "Verify Your Email Address - Ozrit Shop 🔑";
  const bodyContent = `
    <h2>Hi ${user.name},</h2>
    <p>Thank you for registering with Ozrit Shop. To activate your account and secure your profile, please verify your email address by entering the 6-digit One-Time Password (OTP) below:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.25em; padding: 16px 32px 16px 40px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
        ${otp}
      </div>
    </div>
    
    <p style="text-align: center; font-size: 14px; color: #64748b; font-weight: 500;">
      This verification code is valid for <strong>10 minutes</strong>.
    </p>
    
    <div class="divider"></div>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
      If you did not initiate this request, please disregard this email or contact support if you have security concerns.
    </p>
  `;
  const html = getEmailWrapper(subject, "Verify your email address", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendWelcomeEmail = async (user) => {
  const subject = "Welcome to Ozrit Shop! 🎉";
  const bodyContent = `
    <h2>Hi ${user.name},</h2>
    <p>Thank you for registering an account with Ozrit Shop! We are absolutely thrilled to welcome you to our community.</p>
    <p>Get ready to browse and purchase the best curated catalog of premium fashion, accessories, and products, enjoying seamless transactions and ultra-fast deliveries.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" class="button" target="_blank">Start Shopping Now</a>
    </div>
    <p>If you have any questions or need help setting up your profile, simply reply to this email. We are here to help!</p>
  `;
  const html = getEmailWrapper(subject, "Welcome to Ozrit Shop!", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendEmailVerifiedEmail = async (user) => {
  const subject = "Email Address Verified Successfully! ✔️";
  const bodyContent = `
    <h2>Great News, ${user.name}!</h2>
    <p>Your email address <strong>${user.email}</strong> has been successfully verified.</p>
    <p>Your account is now fully secured and unlocked for seamless shopping, orders tracking, and checkout experiences.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile" class="button" target="_blank">View Your Profile</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Email verified successfully", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = "Password Reset Request";
  const bodyContent = `
    <h2>Hello ${user.name},</h2>
    <p>We received a request to reset your password for your Ozrit Shop account. Click the button below to set a new password:</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
    </div>
    <p>This password reset link is valid for **15 minutes**. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
  `;
  const html = getEmailWrapper(subject, "Reset your password", bodyContent);
  await sendEmail(user.email, subject, html);
};

// ─── ORDER NOTIFICATIONS (USER) ──────────────────────────────────────────────

export const sendOrderCreatedEmail = async (user, order) => {
  const subject = `Order Confirmed: #${order.id} 🛍️`;
  const bodyContent = `
    <h2>Thank you for your order, ${user.name}!</h2>
    <p>Your order <strong>#${order.id}</strong> has been successfully placed. We are currently processing your items and will update you as soon as they are packed.</p>
    
    <div class="divider"></div>
    <h3 style="color:#0f172a; margin-bottom:12px;">Order Summary</h3>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
    
    ${renderPaymentDetails(order)}
    
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order.id}" class="button" target="_blank">Track Your Order</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Order successfully confirmed", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendPaymentReceivedEmail = async (user, order) => {
  const subject = `Payment Confirmed for Order #${order.id} 💳`;
  const bodyContent = `
    <h2>Payment Received, ${user.name}!</h2>
    <p>We have successfully received and verified your payment for order <strong>#${order.id}</strong>. Thank you for your payment!</p>
    <p>Our team is now getting your order ready to ship.</p>
    
    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
    
    ${renderPaymentDetails(order)}
    
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order.id}" class="button" target="_blank">View Order Status</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Payment confirmed successfully", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendOrderPackedEmail = async (user, order) => {
  const subject = `Your order #${order.id} is Packed and Ready! 📦`;
  const bodyContent = `
    <h2>Items Packed!</h2>
    <p>Good news, ${user.name}! The items in your order <strong>#${order.id}</strong> have been carefully inspected, packed, and are ready for handover to our shipping partner.</p>
    
    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
    
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order.id}" class="button" target="_blank">Track Handover</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Order packed and ready", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendOrderShippedEmail = async (user, order) => {
  const subject = `Your order #${order.id} is on the way! 🚚`;
  const bodyContent = `
    <h2>Order Shipped!</h2>
    <p>Great news, ${user.name}! Your order <strong>#${order.id}</strong> has been shipped out and is on the way to your shipping address.</p>
    
    <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; font-size:14px;">
      <h3 style="margin-top:0; color:#0f172a;">Shipping Address</h3>
      <p style="margin: 0; color:#475569;">
        ${order.address?.houseNo || ""}, ${order.address?.street || ""}<br/>
        ${order.address?.village || ""}, ${order.address?.city || ""}<br/>
        Pincode: ${order.address?.pincode || ""}
      </p>
    </div>

    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
    
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order.id}" class="button" target="_blank">Track Delivery Status</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Order has been shipped", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendOrderDeliveredEmail = async (user, order) => {
  const subject = `Delivered: Order #${order.id} has arrived! 🎉`;
  const bodyContent = `
    <h2>Order Delivered!</h2>
    <p>Hi ${user.name}, your order <strong>#${order.id}</strong> was successfully delivered to your shipping address. We hope you are thrilled with your new products!</p>
    
    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
    
    <p>If you love your items, we'd greatly appreciate it if you left us a review on the store profile!</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/products" class="button" target="_blank">Shop More Items</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Order successfully delivered", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendOrderCancelledEmail = async (user, order) => {
  const subject = `Order #${order.id} Cancelled 🛑`;
  const bodyContent = `
    <h2>Order Cancelled</h2>
    <p>Hi ${user.name}, we are confirming that your order <strong>#${order.id}</strong> has been cancelled. Any items reserved for your order have been successfully returned to inventory stock.</p>
    
    ${order.paymentStatus === "paid" ? `
    <p style="background-color: #fffbeb; border-radius: 12px; padding: 16px; color: #92400e; border: 1px solid #fde68a;">
      <strong>Refund Info</strong>: Since this order was already paid, we have automatically initiated a full refund back to your original payment method. The refund will show in your account details shortly.
    </p>` : ""}

    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    ${renderOrderTotals(order)}
  `;
  const html = getEmailWrapper(subject, "Order cancelled successfully", bodyContent);
  await sendEmail(user.email, subject, html);
};

export const sendOrderRefundedEmail = async (user, order) => {
  const subject = `Refund Processed for Order #${order.id} 💵`;
  const bodyContent = `
    <h2>Refund Processed successfully</h2>
    <p>Hi ${user.name}, we have successfully processed a refund of <strong>₹${parseFloat(order.finalAmount).toFixed(2)}</strong> for order <strong>#${order.id}</strong> back to your original payment method.</p>
    <p>Depending on your bank, it may take 5-7 business days for the funds to reflect in your account.</p>
    
    <div class="divider"></div>
    ${renderPaymentDetails(order)}
  `;
  const html = getEmailWrapper(subject, "Refund has been processed", bodyContent);
  await sendEmail(user.email, subject, html);
};

// ─── ADMIN NOTIFICATIONS ─────────────────────────────────────────────────────

export const sendAdminNewOrderEmail = async (order) => {
  const subject = `[ADMIN ALERT] New Order Received: #${order.id} 🚨`;
  // Send admin email to the configured EMAIL_USER
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) return;

  const bodyContent = `
    <h2>New Order Notification</h2>
    <p>A new order has been received on the Ozrit Shop platform.</p>
    
    <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; font-size:14px; margin-bottom: 24px;">
      <strong>Customer:</strong> ${order.User?.name || "Guest"} (${order.User?.email || "N/A"})<br/>
      <strong>Order ID:</strong> #${order.id}<br/>
      <strong>Final Amount:</strong> ₹${parseFloat(order.finalAmount).toFixed(2)}<br/>
      <strong>Payment Method:</strong> ${order.paymentMethod || "Razorpay"}<br/>
      <strong>Payment Status:</strong> <span class="badge badge-${order.paymentStatus}">${order.paymentStatus}</span>
    </div>

    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
    
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/orders/${order.id}" class="button" style="background-color: #dc2626;" target="_blank">Open Admin Dashboard</a>
    </div>
  `;
  const html = getEmailWrapper(subject, "Admin new order received", bodyContent);
  await sendEmail(adminEmail, subject, html);
};

export const sendAdminFailedPaymentEmail = async (order, errorDetail = "Failed at gateway modal") => {
  const subject = `[ADMIN ALERT] Failed Payment on Order #${order.id} ⚠️`;
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) return;

  const bodyContent = `
    <h2>Failed Payment Warning</h2>
    <p>An attempt to check out for Order <strong>#${order.id}</strong> has failed or was rejected by Razorpay.</p>
    
    <div style="background-color: #fef2f2; border-radius: 16px; padding: 20px; border: 1px solid #fca5a5; font-size:14px; margin-bottom: 24px; color:#991b1b;">
      <strong>Customer:</strong> ${order.User?.name || "Guest"} (${order.User?.email || "N/A"})<br/>
      <strong>Order ID:</strong> #${order.id}<br/>
      <strong>Final Amount:</strong> ₹${parseFloat(order.finalAmount).toFixed(2)}<br/>
      <strong>Error Reason:</strong> ${errorDetail}
    </div>

    <div class="divider"></div>
    ${renderOrderItemsTable(order)}
  `;
  const html = getEmailWrapper(subject, "Failed payment alert", bodyContent);
  await sendEmail(adminEmail, subject, html);
};
