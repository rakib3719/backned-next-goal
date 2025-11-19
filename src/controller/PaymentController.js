import Stripe from "stripe";
import User from "../models/UserModel.js";
import Premium from "../models/PremiumModel.js";
import PaymentHistory from "../models/PaymentHistoryModel.js";
import dotenv from "dotenv";
import cron from "cron";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1️⃣ Create Session (Payment Link)
export const createSession = async (req, res) => {
  try {
    const { email, plan } = req.body;
    

    if (!email || !plan) {
      return res.status(400).json({ message: "Email and plan are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const plans = {
      Starter: { price: 1200, name: "Starter Plan" },
      Plus: { price: 1700, name: "Plus Plan" },
      Max: { price: 2500, name: "Max Plan" },
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid plan selected." });
    }

    // Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selectedPlan.name },
            unit_amount: selectedPlan.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: { email, plan },
      success_url: `http://localhost:3000/payment-success`,
      cancel_url: `http://localhost:3000/payment-cancel`,
    });

    // Save pending Premium
    await Premium.create({
      email,
      plan,
      price: selectedPlan.price,
      stripeSessionId: session.id,
      paymentStatus: "pending",
    });

    res.status(200).json({ message: "Session created successfully", url: session.url });
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2️⃣ Stripe Webhook
export const webHook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.metadata.email;
      const plan = session.metadata.plan;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days premium

      // 1️⃣ Update User
      const user = await User.findOneAndUpdate(
        { email },
        {
          isPremium: true,
          premiumExpireDate: endDate,
        },
        { new: true }
      );

      if (!user) {
        console.error("User not found for webhook:", email);
        return res.status(404).json({ message: "User not found" });
      }

      // 2️⃣ Update Premium
      const premium = await Premium.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          paymentStatus: "paid",
          startDate,
          endDate,
          status: "active",
        },
        { new: true }
      );

      if (!premium) {
        console.error("Premium record not found for webhook:", session.id);
      }

      // 3️⃣ Add PaymentHistory
      await PaymentHistory.create({
        user: user._id,
        email,
        plan,
        price: premium ? premium.price : 0,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        startDate,
        endDate,
        status: "active",
      });

      console.log(`Payment recorded for ${email} (${plan})`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Webhook Error", error });
  }
};

// 4️⃣ Optional: Cron job to reset expired premium daily at midnight
// cron.schedule("0 0 * * *", async () => {
//   try {
//     const result = await User.updateMany(
//       { premiumExpireDate: { $lt: new Date() }, isPremium: true },
//       { isPremium: false }
//     );
//     console.log(`Expired premium users reset: ${result.modifiedCount}`);
//   } catch (err) {
//     console.error("Cron job error:", err);
//   }
// });
