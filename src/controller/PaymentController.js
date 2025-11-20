import Stripe from "stripe";
import User from "../models/UserModel.js";
import Premium from "../models/PremiumModel.js";
import PaymentHistory from "../models/PaymentHistoryModel.js";
import dotenv from "dotenv";
import connectDB from "../configure/db.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 1. CREATE SUBSCRIPTION SESSION
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

    if (user.isPremium) {
      return res.status(400).json({ message: "User is already a premium member." });
    }

    // ✅ SUBSCRIPTION PRICE IDs
    const subscriptionPlans = {
      Starter: { 
        price_id: "price_1SVV5oP0aOrzI3fiMzJ57JoR",
        name: "Starter Plan" 
      },
      Plus: { 
        price_id: "price_1SVV64P0aOrzI3fiZvpLJBoS",
        name: "Plus Plan" 
      },
      Max: { 
        price_id: "price_1SVV6IP0aOrzI3fiiXPfotdO",
        name: "Max Plan" 
      },
    };

    const selectedPlan = subscriptionPlans[plan];
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid plan selected." });
    }

    // ✅ Create or get Stripe Customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: user._id.toString(),
          userEmail: email
        }
      });
      
      await User.findByIdAndUpdate(user._id, { 
        stripeCustomerId: customer.id 
      });
    }

    // ✅ SUBSCRIPTION Session Create
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: selectedPlan.price_id,
          quantity: 1,
        },
      ],
      metadata: { 
        email, 
        plan,
        userId: user._id.toString(),
        stripeCustomerId: customer.id
      },
      subscription_data: {
        metadata: {
          email: email,
          plan: plan,
          userId: user._id.toString()
        }
      },
      success_url: `http://localhost:3000/subscription-details/upgrade-plan`,
      cancel_url: `http://localhost:3000/subscription-details/upgrade-plan`,
    });

    // ✅ Premium record create
    await Premium.create({
      email,
      plan,
      price: 0,
      stripeSessionId: session.id,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null,
      paymentStatus: "pending",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "pending",
      isSubscription: true
    });

    res.status(200).json({ 
      message: "Subscription session created successfully", 
      url: session.url,
      sessionId: session.id,
      stripeCustomerId: customer.id
    });
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ 2. WEBHOOK - COMPLETE SUBSCRIPTION HANDLING
export const webHook = async (req, res) => {
  await connectDB();
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
      console.log("❌ Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`✅ Webhook received: ${event.type}`);

    // ✅ Handle ALL subscription events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;
        
      case "customer.subscription.created":
        await handleSubscriptionCreated(event);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
        
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;
        
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
        
      default:
        console.log(`⚡ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("🔥 Webhook Error:", error);
    res.status(500).json({ message: "Webhook Error", error });
  }
};

// ✅ Common function to get email from customer
const getEmailFromCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer.email;
  } catch (error) {
    console.error("Error retrieving customer:", error);
    return null;
  }
};

// ✅ Handle checkout session completed - PERFECTED
// ✅ Handle checkout session completed - FIXED DATE ERROR
const handleCheckoutSessionCompleted = async (event) => {
  try {
    const session = event.data.object;
    const email = session.metadata.email;
    const plan = session.metadata.plan;
    
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    console.log(`💰 Subscription checkout completed for ${email}`);
    console.log(`✅ Customer ID: ${customerId}`);
    console.log(`✅ Subscription ID: ${subscriptionId}`);

    if (!customerId) {
      throw new Error(`Could not find Stripe customer for email: ${email}`);
    }

    // ✅ FIX: Get subscription details with PROPER ERROR HANDLING
    let endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log(`📅 Subscription current_period_end: ${subscription.current_period_end}`);
        
        // ✅ VALIDATE: current_period_end valid kina
        if (subscription.current_period_end && !isNaN(subscription.current_period_end)) {
          const periodEnd = subscription.current_period_end * 1000;
          if (!isNaN(periodEnd)) {
            endDate = new Date(periodEnd);
            console.log(`✅ Valid end date: ${endDate}`);
          } else {
            console.log(`⚠️ Invalid periodEnd timestamp, using default`);
          }
        } else {
          console.log(`⚠️ Invalid current_period_end, using default 30 days`);
        }
      } catch (subError) {
        console.error(`❌ Error retrieving subscription: ${subError.message}`);
        console.log(`⚠️ Using default end date`);
      }
    } else {
      console.log(`⚠️ No subscription ID found, using default 30 days`);
    }

    // ✅ DOUBLE VALIDATE: endDate valid kina
    if (isNaN(endDate.getTime())) {
      console.error(`❌ Invalid endDate detected, setting to default`);
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    console.log(`✅ Final endDate: ${endDate}, Valid: ${!isNaN(endDate.getTime())}`);

    // ✅ 1. Update User - WITH DATE VALIDATION
    const user = await User.findOneAndUpdate(
      { email },
      {
        isPremium: true,
        premiumExpireDate: endDate,
        stripeCustomerId: customerId,
      },
      { new: true }
    );

    if (!user) {
      console.error("❌ User not found:", email);
      throw new Error(`User not found: ${email}`);
    }

    // ✅ 2. Update Premium - WITH DATE VALIDATION
    const premiumUpdate = await Premium.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        paymentStatus: "paid",
        startDate: new Date(),
        endDate: endDate,
        status: "active",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        isSubscription: true,
      },
      { new: true }
    );

    console.log("Premium Update Result:", premiumUpdate);

    if (!premiumUpdate) {
      const newPremium = await Premium.create({
        email,
        plan,
        price: 0,
        stripeSessionId: session.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        paymentStatus: "paid",
        startDate: new Date(),
        endDate: endDate,
        status: "active",
        isSubscription: true
      });
      console.log("New Premium Created:", newPremium);
    }

    // ✅ 3. Add PaymentHistory - WITH DATE VALIDATION
    await PaymentHistory.create({
      user: user._id,
      email,
      plan,
      price: session.amount_total ? session.amount_total / 100 : 0,
      stripeSessionId: session.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "paid",
      startDate: new Date(),
      endDate: endDate,
      status: "active",
    });

    console.log(`✅ Subscription setup completed for ${email}`);
    
  } catch (error) {
    console.error("❌ Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
};
// ✅ Handle subscription creation - PERFECTED
const handleSubscriptionCreated = async (event) => {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    console.log(`🆕 Subscription created: ${subscriptionId}`);

    const email = await getEmailFromCustomer(customerId);
    if (!email) {
      console.error("❌ Email not found for customer:", customerId);
      return;
    }

    // ✅ Update Premium with subscriptionId
    const updateResult = await Premium.findOneAndUpdate(
      { 
        email, 
        stripeCustomerId: customerId,
        paymentStatus: "paid"
      },
      {
        stripeSubscriptionId: subscriptionId,
        status: "active",
        endDate: new Date(subscription.current_period_end * 1000),
        isSubscription: true
      },
      { 
        new: true, 
        sort: { createdAt: -1 } 
      }
    );

    if (updateResult) {
      console.log(`✅ Subscription ID saved in Premium for ${email}: ${subscriptionId}`);
    } else {
      console.log(`⚠️ No premium record found for ${email}`);
    }

    // ✅ Update User
    await User.findOneAndUpdate(
      { email },
      {
        isPremium: true,
        premiumExpireDate: new Date(subscription.current_period_end * 1000),
      }
    );
    
  } catch (error) {
    console.error("❌ Error in handleSubscriptionCreated:", error);
  }
};

// ✅ Handle subscription updates - PERFECTED
const handleSubscriptionUpdated = async (event) => {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    console.log(`🔄 Subscription updated: ${subscriptionId}, Status: ${subscription.status}`);

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("❌ User not found for subscription update:", customerId);
      return;
    }

    // Update Premium record
    const premiumUpdate = await Premium.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: subscription.status,
        endDate: new Date(subscription.current_period_end * 1000),
        paymentStatus: subscription.status === 'active' ? 'paid' : subscription.status
      },
      { new: true }
    );

    if (premiumUpdate) {
      console.log(`✅ Premium updated for ${user.email}, Status: ${subscription.status}`);
    }

    // Update User status
    if (subscription.status !== 'active') {
      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { isPremium: false }
      );
      console.log(`✅ User premium status set to false for ${user.email}`);
    }

    console.log(`✅ Subscription updated for ${user.email}`);
    
  } catch (error) {
    console.error("❌ Error in handleSubscriptionUpdated:", error);
  }
};

// ✅ Handle subscription cancellation - PERFECTED
const handleSubscriptionDeleted = async (event) => {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    console.log(`🗑️ Subscription deleted: ${subscriptionId}`);

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("❌ User not found for subscription deletion:", customerId);
      return;
    }

    // Update Premium record
    const premiumUpdate = await Premium.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: "canceled",
        endDate: new Date(),
        paymentStatus: "canceled",
      },
      { new: true }
    );

    if (premiumUpdate) {
      console.log(`✅ Premium canceled for ${user.email}`);
    }

    // Update User
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        isPremium: false,
        premiumExpireDate: new Date(),
      }
    );

    // Add to Payment History
    await PaymentHistory.create({
      user: user._id,
      email: user.email,
      plan: "canceled",
      price: 0,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "canceled",
      startDate: new Date(),
      endDate: new Date(),
      status: "cancelled",
    });

    console.log(`✅ Subscription canceled for ${user.email}`);
    
  } catch (error) {
    console.error("❌ Error in handleSubscriptionDeleted:", error);
  }
};

// ✅ Handle successful recurring payment - PERFECTED
const handleInvoicePaymentSucceeded = async (event) => {
  try {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    console.log(`💳 Recurring payment succeeded for subscription: ${subscriptionId}`);

    const email = await getEmailFromCustomer(customerId);
    if (!email) {
      console.error("❌ Email not found for customer:", customerId);
      return;
    }

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("❌ User not found for invoice payment:", customerId);
      return;
    }

    const startDate = new Date(invoice.period_start * 1000);
    const endDate = new Date(invoice.period_end * 1000);

    // Create new Premium record for renewal
    await Premium.create({
      email: user.email,
      plan: "renewal",
      price: invoice.amount_paid / 100,
      paymentStatus: "paid",
      startDate,
      endDate,
      status: "active",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      isSubscription: true
    });

    // Update User
    await User.findOneAndUpdate(
      { stripeCustomerId: customerId },
      {
        isPremium: true,
        premiumExpireDate: endDate,
      }
    );

    // Add to Payment History
    await PaymentHistory.create({
      user: user._id,
      email: user.email,
      plan: "renewal",
      price: invoice.amount_paid / 100,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "paid",
      startDate,
      endDate,
      status: "active",
    });

    console.log(`✅ Renewal processed for ${user.email}`);
    
  } catch (error) {
    console.error("❌ Error in handleInvoicePaymentSucceeded:", error);
  }
};

// ✅ Handle failed payment - PERFECTED
const handleInvoicePaymentFailed = async (event) => {
  try {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    console.log(`❌ Payment failed for subscription: ${subscriptionId}`);

    const email = await getEmailFromCustomer(customerId);
    if (!email) {
      console.error("❌ Email not found for customer:", customerId);
      return;
    }

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error("❌ User not found for failed payment:", customerId);
      return;
    }

    // Update Premium record
    await Premium.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        paymentStatus: "failed",
        status: "past_due",
      }
    );

    // Add to Payment History
    await PaymentHistory.create({
      user: user._id,
      email: user.email,
      plan: "payment_failed",
      price: invoice.amount_due / 100,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "failed",
      startDate: new Date(),
      endDate: new Date(),
      status: "expired",
    });

    console.log(`⚠️ Payment failed recorded for ${user.email}`);
    
  } catch (error) {
    console.error("❌ Error in handleInvoicePaymentFailed:", error);
  }
};

// ✅ 3. CANCEL SUBSCRIPTION - PERFECTED
export const cancelSubscription = async (req, res) => {
  try {
    const { email } = req.body;

    console.log(`🔄 Cancelling subscription for email: ${email}`);

    // Find user's ACTIVE premium record
    const premium = await Premium.findOne({ 
      email, 
      status: 'active',
      stripeSubscriptionId: { $exists: true, $ne: null },
      isSubscription: true
    }).sort({ createdAt: -1 });

    if (!premium) {
      return res.status(404).json({ 
        success: false,
        message: "No active subscription found for this user." 
      });
    }

    const subscriptionId = premium.stripeSubscriptionId;

    // Verify subscription exists
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'canceled') {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled."
      });
    }

    // Cancel subscription immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update database
    await Premium.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: 'canceled',
        endDate: new Date(),
        paymentStatus: 'canceled'
      }
    );

    await User.findOneAndUpdate(
      { email },
      {
        isPremium: false,
        premiumExpireDate: new Date()
      }
    );

    // Add cancellation record to PaymentHistory
    await PaymentHistory.create({
      user: premium.userId || null,
      email: email,
      plan: premium.plan + " (canceled)",
      price: 0,
      stripeCustomerId: premium.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "canceled",
      startDate: new Date(),
      endDate: new Date(),
      status: "cancelled",
    });

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: new Date(canceledSubscription.canceled_at * 1000)
      }
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    
    let errorMessage = "Something went wrong while cancelling subscription!";
    let statusCode = 500;

    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_missing') {
        errorMessage = "Subscription not found in Stripe.";
        statusCode = 404;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// ✅ 4. GET SUBSCRIPTION STATUS - PERFECTED
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { email } = req.params;

    const premium = await Premium.findOne({ 
      email, 
      isSubscription: true 
    }).sort({ createdAt: -1 });

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: "No subscription found for this user."
      });
    }

    let subscriptionDetails = null;
    if (premium.stripeSubscriptionId) {
      try {
        subscriptionDetails = await stripe.subscriptions.retrieve(
          premium.stripeSubscriptionId
        );
      } catch (error) {
        console.error("Error fetching subscription from Stripe:", error);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        email: premium.email,
        plan: premium.plan,
        status: premium.status,
        paymentStatus: premium.paymentStatus,
        startDate: premium.startDate,
        endDate: premium.endDate,
        stripeCustomerId: premium.stripeCustomerId,
        stripeSubscriptionId: premium.stripeSubscriptionId,
        isSubscription: premium.isSubscription,
        subscriptionDetails: subscriptionDetails ? {
          id: subscriptionDetails.id,
          status: subscriptionDetails.status,
          current_period_start: new Date(subscriptionDetails.current_period_start * 1000),
          current_period_end: new Date(subscriptionDetails.current_period_end * 1000),
          cancel_at_period_end: subscriptionDetails.cancel_at_period_end
        } : null
      }
    });

  } catch (error) {
    console.error("Get Subscription Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscription status",
      error: error.message
    });
  }
};

// ✅ 5. DEBUG CUSTOMER & SUBSCRIPTION - PERFECTED
export const debugCustomerId = async (req, res) => {
  try {
    const email = req.params.email;

    const premiumRecords = await Premium.find({ email });
    const user = await User.findOne({ email });

    // Try to find customer in Stripe
    let stripeCustomer = null;
    let stripeSubscriptions = [];
    
    try {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });
      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];
        
        // Get subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomer.id,
          limit: 10
        });
        stripeSubscriptions = subscriptions.data;
      }
    } catch (error) {
      console.error("Stripe customer search error:", error);
    }

    res.status(200).json({
      email,
      premiumRecords: premiumRecords.map(p => ({
        id: p._id,
        stripeCustomerId: p.stripeCustomerId,
        stripeSessionId: p.stripeSessionId,
        stripeSubscriptionId: p.stripeSubscriptionId,
        paymentStatus: p.paymentStatus,
        status: p.status,
        isSubscription: p.isSubscription,
        createdAt: p.createdAt
      })),
      user: {
        stripeCustomerId: user?.stripeCustomerId,
        isPremium: user?.isPremium,
        premiumExpireDate: user?.premiumExpireDate
      },
      stripeCustomer: stripeCustomer ? {
        id: stripeCustomer.id,
        email: stripeCustomer.email,
        created: new Date(stripeCustomer.created * 1000)
      } : null,
      stripeSubscriptions: stripeSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000),
        created: new Date(sub.created * 1000)
      }))
    });

  } catch (error) {
    console.error("Debug Error:", error);
    res.status(500).json({ error: error.message });
  }
};