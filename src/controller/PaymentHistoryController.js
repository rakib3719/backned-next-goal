import Email from "../models/EmailModel.js";
import PaymentHistory from "../models/PaymentHistoryModel.js";
import Premium from "../models/PremiumModel.js";
import User from "../models/UserModel.js";

export const userOverview = async(req, res)=>{
    try {

        const email = req.params.email;
        const totalCost = await PaymentHistory.aggregate([
            { $match: { email: email } },
            { $group: { _id: null, totalAmount: { $sum: "$price" } } }
        ]);

        const subscriptionEnding = await Premium.findOne({ email: email })
        .sort({ endDate: -1 })
        .select('endDate');

        const totalSubscriptions = await Email.countDocuments({ sender: email });

        const totalPaymentThisMontsh = await PaymentHistory.aggregate([
            { 
                $match: { 
                    email: email,
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                    }
                } 
            },
            { $group: { _id: null, totalAmount: { $sum: "$price" } } }
        ]);

        res.status(200).json({
            totalAmountPaid: totalCost[0] ? totalCost[0].totalAmount : 0,
            totalSubscriptions: totalSubscriptions,
            totalPaymentThisMonth: totalPaymentThisMontsh[0] ? totalPaymentThisMontsh[0].totalAmount : 0,
            subscriptionEnding: subscriptionEnding ? subscriptionEnding.endDate : null,})



    } catch (error) {
        res.error(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
};



export const getStatisticsData = async (req, res) => {
  try {
    const email = req.params.email;

    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get monthly data for the current year
    const monthlyData = await PaymentHistory.aggregate([
      {
        $match: {
          email: email,
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$price" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    // Format monthly data for all 12 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formattedMonthlyData = monthNames.map((monthName, index) => {
      const monthData = monthlyData.find(item => item._id.month === index + 1);
      
      return {
        month: monthName,
        sales: monthData ? monthData.count : 0,
        revenue: monthData ? monthData.totalAmount : 0,
        emailsSent: monthData ? Math.floor(monthData.count * 12.5) : 0, // Example calculation for emails
        totalAmount: monthData ? monthData.totalAmount : 0
      };
    });

    // Get additional statistics
    const totalCost = await PaymentHistory.aggregate([
      { $match: { email: email } },
      { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    ]);

    const subscriptionEnding = await Premium.findOne({ email: email })
      .sort({ endDate: -1 })
      .select('endDate');

    const totalSubscriptions = await Premium.countDocuments({ email: email });

    const totalPaymentThisMonth = await PaymentHistory.aggregate([
      { 
        $match: { 
          email: email,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        } 
      },
      { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    ]);

    res.status(200).json({
      monthlyData: formattedMonthlyData,
      overview: {
        totalAmountPaid: totalCost[0] ? totalCost[0].totalAmount : 0,
        totalSubscriptions: totalSubscriptions,
        totalPaymentThisMonth: totalPaymentThisMonth[0] ? totalPaymentThisMonth[0].totalAmount : 0,
        subscriptionEnding: subscriptionEnding ? subscriptionEnding.endDate : null,
      }
    });

  } catch (error) {
    console.error('Error in statistics API:', error);
    res.status(500).json({
      error: error.message,
      message: "Something went wrong while fetching statistics!",
    });
  }
};



export const latestPayments= async(req, res)=>{
   try {
     const email = req.params.email;
   const payments = await PaymentHistory.find({ email: email })
    .sort({ createdAt: -1 })
    .limit(5);

    res.status(200).json({
        data:payments
    }); 
    
   } catch (error) {
    res.status(500).json({
        error,
        message: error.message || "Something went wrong!",
    });
   }
}


export const userPaymetsHistory = async(req, res)=>{
    try {
        const email = req.params.email;
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const paymentData = await PaymentHistory.find({ email: email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.status(200).json({
            data:paymentData
        });


        
    } catch (error) {
        res.status(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
};



export const adminOverview = async(req, res)=>{


    try {


        const totalUser = await User.countDocuments({});
        const totalSubscriptions = await Premium.countDocuments({});
 const totalPayments = await PaymentHistory.aggregate([
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$price" }
    }
  }
]);
        const totalPaymentsThisMonth = await PaymentHistory.aggregate([
            { 
                $match: { 
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                    }
                } 
            },
            { $group: { _id: null, totalAmount: { $sum: "$price" } } }
        ]);

        res.status(200).json({
            totalUser: totalUser,
            totalSubscriptions: totalSubscriptions,
            totalPayments: totalPayments[0] ? totalPayments[0].totalAmount : 0,
            totalPaymentsThisMonth: totalPaymentsThisMonth[0] ? totalPaymentsThisMonth[0].totalAmount : 0,
        });
        
    } catch (error) {
        res.status(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
}



export const latestPaymentsAll = async(req, res)=>{
    try {
        const payments = await PaymentHistory.find({})
        .sort({ createdAt: -1 })
        .limit(5);  
        res.status(200).json({
            data:payments
        });
        
    } catch (error) {
        res.status(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
}


export const adminPaymetsHistory = async(req, res)=>{
    try {
      
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const paymentData = await PaymentHistory.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.status(200).json({
            data:paymentData
        });


        
    } catch (error) {
        res.status(500).json({
            error,
            message: error.message || "Something went wrong!",
        });
    }
};



export const adminStatisticsOverview = async (req, res) => {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();

    // Aggregate monthly data for all users
    const monthlyData = await PaymentHistory.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$price" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formattedMonthlyData = monthNames.map((monthName, index) => {
      const monthData = monthlyData.find(item => item._id.month === index + 1);
      return {
        month: monthName,
        sales: monthData ? monthData.count : 0,
        revenue: monthData ? monthData.totalAmount : 0,
        emailsSent: monthData ? Math.floor(monthData.count * 12.5) : 0,
        totalAmount: monthData ? monthData.totalAmount : 0
      };
    });

    // Overall stats
    const totalCost = await PaymentHistory.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    ]);

    const totalSubscriptions = await Premium.countDocuments({});
    const subscriptionEnding = await Premium.findOne({})
      .sort({ endDate: -1 })
      .select('endDate');

    const totalPaymentThisMonth = await PaymentHistory.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      },
      { $group: { _id: null, totalAmount: { $sum: "$price" } } }
    ]);

    res.status(200).json({
      monthlyData: formattedMonthlyData,
      overview: {
        totalAmountPaid: totalCost[0] ? totalCost[0].totalAmount : 0,
        totalSubscriptions: totalSubscriptions,
        totalPaymentThisMonth: totalPaymentThisMonth[0] ? totalPaymentThisMonth[0].totalAmount : 0,
        subscriptionEnding: subscriptionEnding ? subscriptionEnding.endDate : null,
      }
    });

  } catch (error) {
    console.error("Error in admin statistics API:", error);
    res.status(500).json({
      error: error.message,
      message: "Something went wrong while fetching admin statistics!"
    });
  }
};