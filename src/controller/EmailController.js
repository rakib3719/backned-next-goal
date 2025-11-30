// pages/api/send-email.js
import multer from 'multer';
import nodemailer from 'nodemailer';
import dbConnect from '../configure/db.js'; // আপনার database connection file
import Email from '../models/EmailModel.js';
import Coach from '../models/CoachModel.js';
import Premium from '../models/PremiumModel.js';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Disable bodyParser for this route to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

export const sendEmail = async (req, res) => {


  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse multipart form data using multer
    await new Promise((resolve, reject) => {
      upload.any()(req, {}, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    console.log("📧 Received request body:", req.body);
    console.log("📎 Received files:", req.files);

    // Extract form data
    const { subject, body, sender, recipient, coachId, coachData } = req.body;

    const senderUser = await Premium.findOne({email:sender});
    const plan = senderUser.plan;
const nows = new Date();

// today start (UTC)
const startOfToday = new Date(Date.UTC(
  nows.getUTCFullYear(),
  nows.getUTCMonth(),
  nows.getUTCDate(),
  0, 0, 0, 0
));

// today end (UTC)
const endOfToday = new Date(Date.UTC(
 nows.getUTCFullYear(),
 nows.getUTCMonth(),
  nows.getUTCDate(),
  23, 59, 59, 999
));

const todaysCount = await Email.countDocuments({
  sender,
  createdAt: { $gte: startOfToday, $lte: endOfToday }
});



if(plan == "Plus" && todaysCount >= 25){
  res.status(401).json({
    message:"Your daily quota is reach out"
  })
}
if(plan == "Starter" && todaysCount >= 15){
  res.status(401).json({
    message:"Your daily quota is reach out"
  })
}
if(plan == "Max" && todaysCount >= 30){
  res.status(401).json({
    message:"Your daily quota is reach out"
  })
}

console.log(todaysCount, "this is todays count")




    
    // Get attachments from files
    const attachments = req.files || [];

    console.log("📧 Sending single email:", {
      subject,
      sender,
      recipient,
      coachId,
      coachData: coachData ? JSON.parse(coachData) : null,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length
    });

    // Validate required fields
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    // ✅ Connect to database FIRST
    console.log('🔌 Connecting to database...');
    await dbConnect();
    console.log('✅ Database connected successfully');

    // Check if coach exists
    let coach = null;
    if (coachId) {
      coach = await Coach.findById(coachId);
      if (!coach) {
        console.log(`⚠️ Coach not found with ID: ${coachId}`);
        // Continue even if coach not found, don't throw error
      } else {
        console.log(`✅ Coach found: ${coach.name || coach.email}`);
      }
    }

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      auth: {
        user: "bannah76769@gmail.com",
        pass: "noqq kzxv olzf clzz",
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error',
        error: verifyError.message
      });
    }

    // Prepare email options
    const mailOptions = {
      from: sender || "bannah76769@gmail.com",
      to: recipient,
      subject: subject || 'No Subject',
      text: body || 'No content',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #ffffff; 
                    border-radius: 8px; 
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px 20px; 
                    text-align: center; 
                    color: white;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 24px; 
                    font-weight: bold;
                }
                .content { 
                    padding: 30px 20px; 
                    background: #fff;
                }
                .footer { 
                    margin-top: 20px; 
                    padding: 20px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #666;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                }
                .coach-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #667eea;
                }
                .attachment-note {
                    background: #fff3cd;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    border-left: 4px solid #ffc107;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${subject || 'Email from Coaching Platform'}</h1>
                </div>
                <div class="content">
                    ${(body || 'No content').replace(/\n/g, '<br>')}
                    
                    ${coachData ? `
                    <div class="coach-info">
                        <strong>Coach Information:</strong><br>
                        ${Object.entries(JSON.parse(coachData)).map(([key, value]) => 
                          `<strong>${key}:</strong> ${value}<br>`
                        ).join('')}
                    </div>
                    ` : ''}
                    
                    ${attachments.length > 0 ? `
                    <div class="attachment-note">
                        <strong>📎 This email contains ${attachments.length} attachment(s)</strong>
                    </div>
                    ` : ''}
                </div>
                <div class="footer">
                    <p>This email was sent from the Coaching Platform</p>
                    <p>© ${new Date().getFullYear()} Coaching Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    // Add attachments if any
    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }

    console.log('📤 Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentCount: mailOptions.attachments ? mailOptions.attachments.length : 0
    });

    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      recipient,
      messageId: result.messageId,
      response: result.response
    });

    // ✅ Save to database - Email Model
    const now = new Date();
    
    // Create email record data
    const emailData = {
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      time: now.toTimeString().split(' ')[0], // HH:MM:SS format
      coach: coachId, // Coach ID
      engagementScore: 0, // Default score
      subject: subject || '',
      recipient: recipient,
      sender: sender || '',
      messageId: result.messageId || '',
      attachmentsCount: attachments.length,
      status: 'sent'
    };

    console.log('💾 Saving email record to database:', emailData);

    // Save to database
    const emailRecord = new Email(emailData);
    const savedEmail = await emailRecord.save();
    
    console.log('✅ Email record saved to database:', savedEmail._id);
    console.log('📊 Saved email details:', {
      id: savedEmail._id,
      date: savedEmail.date,
      time: savedEmail.time,
      coach: savedEmail.coach,
      recipient: savedEmail.recipient
    });

    // Success response
    res.status(200).json({
      success: true,
      message: `Email sent successfully to ${recipient}`,
      messageId: result.messageId,
      recipient: recipient,
      timestamp: new Date().toISOString(),
      attachmentsSent: attachments.length,
      emailRecordId: savedEmail._id,
      databaseSave: true
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
      error: error.toString(),
      recipient: req.body?.recipient
    });
  }
}


// controllers/emailController.js
export const myEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      dateFilter = ''
    } = req.query;

    // Build filter object
    const filter = { sender: email };
    
    // Search filter
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { recipient: { $regex: search, $options: 'i' } },
        { sender: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      filter.status = status;
    }

    // Date filter
    if (dateFilter && dateFilter !== 'All') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get emails with pagination
    const emails = await Email.find(filter)
      .populate('coach', 'name school') // Populate coach data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Email.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: "Success",
      data: emails,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalEmails: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      error: error.message,
      message: "Failed to fetch emails"
    });
  }
};




export const checkLimit = async (req, res) => {
  try {
    const email = req.params.email;

    const senderUser = await Premium.findOne({ email });

    if (!senderUser) {
      return res.status(404).json({
        message: "User not found in Premium collection",
      });
    }

    const plan = senderUser.plan;

    const now = new Date();

    const startOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    const endOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    ));

    // IMPORTANT: field must be "sender", not "email"
    const todaysCount = await Email.countDocuments({
      sender: email,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    return res.status(200).json({
      message: "Success",
      todaysCount,
      plan,
    });

  } catch (error) {
    return res.status(500).json({
      message: error?.message,
      error
    });
  }
};
