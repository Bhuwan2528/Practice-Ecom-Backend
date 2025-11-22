import express from "express";
import Stripe from "stripe";

const router = express.Router();

// Route: Create Payment Intent
router.post("/create-payment-intent", async (req, res) => {
  console.log("STRIPE KEY =", process.env.STRIPE_SECRET_KEY);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.log("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
