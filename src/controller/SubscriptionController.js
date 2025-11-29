import Stripe from "stripe";
import Premium from "../models/PremiumModel.js";
import dotenv from 'dotenv'
import User from "../models/UserModel.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);  

export const mySubscriptions = async (req, res) => {
    try {
        const email = req.params.email;
       const latestActiveSubscription = await Premium.findOne({
  email,
  endDate: { $gt: new Date() }   // still active
})
  .sort({ endDate: -1 });


  if(!latestActiveSubscription){
    return res.status(404).json({
      message: "No active subscription found for this email."
    });
  }
  res.status(200).json({
    subscription: latestActiveSubscription || null
  });

        
    } catch (error) {
        res.status(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
}


// ❌ 4. Cancel Subscription - Simplified Version
export const cancelSubscriptionByEmail = async (req, res) => {
  try {
    const { email, id } = req.body;

    console.log(`🔄 Cancelling subscription for email: ${email}`);
    console.log(`📋 Subscription ID: ${id}`);

    // ✅ Option 1: Direct subscription ID diye cancel (Best way)
    const subscriptionId = id; // Direct subscription ID use koro

    if (!subscriptionId) {
      return res.status(400).json({ 
        success: false,
        message: "Subscription ID is required." 
      });
    }

    // ✅ Verify subscription exists in stripe
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log(`✅ Subscription found: ${subscription.id}, Status: ${subscription.status}`);
    } catch (stripeError) {
      console.error("❌ stripe subscription retrieval error:", stripeError);
      return res.status(404).json({ 
        success: false,
        message: "Subscription not found in stripe." 
      });
    }
    
    // ✅ Check if already cancelled
    if (subscription.status === 'canceled') {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled."
      });
    }

    // ✅ Cancel subscription immediately in stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log(`✅ Subscription cancelled in stripe: ${canceledSubscription.id}`);

    // ✅ Find the premium record using subscription ID
    const premium = await Premium.findOne({ 
      stripeSubscriptionId: subscriptionId 
    });

    if (premium) {
      // ✅ Update Premium record
      await Premium.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: 'canceled',
          endDate: new Date(),
          paymentStatus: 'canceled'
        },
        { new: true }
      );



      
      console.log(`✅ Premium record updated for: ${premium.email}`);
    } else {
      console.log(`⚠️ No premium record found for subscription ID: ${subscriptionId}`);
    }

    // ✅ Update User
    const userUpdate = await User.findOneAndUpdate(
      { email: email },
      {
        isPremium: false,
        premiumExpireDate: new Date()
      },
      { new: true }
    );

    if (userUpdate) {
      console.log(`✅ User updated: ${userUpdate.email}, isPremium: false`);
    } else {
      console.log(`⚠️ User not found with email: ${email}`);
    }

    // ✅ Add to Payment History
    await PaymentHistory.create({
      user: premium?.userId || null,
      email: email,
      plan: premium?.plan || "unknown",
      price: 0,
      stripeCustomerId: premium?.stripeCustomerId || null,
      stripeSubscriptionId: subscriptionId,
      paymentStatus: "canceled",
      startDate: new Date(),
      endDate: new Date(),
      status: "cancelled",
    });

    console.log(`✅ Payment history recorded for cancellation`);

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          canceled_at: new Date(canceledSubscription.canceled_at * 1000),
          current_period_end: new Date(canceledSubscription.current_period_end * 1000)
        },
        user: {
          email: email,
          isPremium: false
        },
        premium: {
          updated: !!premium,
          email: premium?.email
        }
      }
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    
    let errorMessage = "Something went wrong while cancelling subscription!";
    let statusCode = 500;

    if (error.type === 'stripeInvalidRequestError') {
      if (error.code === 'resource_missing') {
        errorMessage = "Subscription not found in stripe.";
        statusCode = 404;
      } else if (error.code === 'resource_already_exists') {
        errorMessage = "Subscription is already cancelled.";
        statusCode = 400;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: errorMessage
    });
  }
};



export const allSubscriptions = async(req, res)=>{
  try {
    const email = req.params.email;
    const subscriptions = await Premium.find({ email:email }).sort({ createdAt: -1 });
    res.status(200).json({
      data:subscriptions
    });
    
  } catch (error) {
    res.status(500).json({
      error,
      message: error.message || "Something went wrong!",
    });
  }
};




export const checkPremium = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("isPremium premiumExpireAt email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Response
    return res.status(200).json({
      success: true,
      message: "Premium status fetched successfully.",
      premium : user.isPremium || false,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred.",
      error: error.message,
    });
  }
};
