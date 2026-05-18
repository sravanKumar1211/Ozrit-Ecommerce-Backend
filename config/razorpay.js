import Razorpay from "razorpay";

let razorpayInstance = null;

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay key id and key secret are required");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};

export const getRazorpayWebhookSecret = () => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Razorpay webhook secret is required");
  }

  return process.env.RAZORPAY_WEBHOOK_SECRET;
};
