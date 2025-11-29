import axios from "axios";
import OpenAI from "openai";

export const emailGeneration = async (req, res) => {

const openai = new OpenAI({
  apiKey: "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",
});

  try {
    const {
      name,
      position,
      graduationYear,
      gpa,
      height,
      weight,
      school,
      highlightLink,
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!name || !position) {
      return res.status(400).json({
        success: false,
        error: "Name and position are required fields"
      });
    }

    const prompt = `
      Generate a professional email template for a student athlete seeking college recruitment opportunities.
      
      Student Information:
      - Name: ${name}
      - Position: ${position}
      - Graduation Year: ${graduationYear}
      - GPA: ${gpa}
      - Height: ${height}
      - Weight: ${weight}
      - School/Team: ${school}
      - Highlight Video: ${highlightLink}
      - Additional Info: ${additionalInfo}
      
      Please generate:
      1. A compelling email subject line
      2. A professional email body that introduces the student, highlights their achievements, and expresses interest in the college program.
      
      Return the response in this exact JSON format:
      {
        "subject": "the subject line here",
        "email": "the email body here"
      }
    `;

  const completion = await openai.chat.completions.create({
  messages: [
    { role: "system", content: "You output only JSON." },
    { role: "user", content: prompt }
  ],
  model: "gpt-4o-mini",
  response_format: { type: "json_object" }
});


    const generatedContent = completion.choices[0].message.content;
    
    // Parse the JSON response from ChatGPT
    let emailData;
    try {
      emailData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // If JSON parsing fails, create a fallback response
      emailData = {
        subject: `Recruitment Interest - ${name} - ${position}`,
        email: `Dear Coach,\n\nMy name is ${name} and I am a ${position} from ${school}. I will be graduating in ${graduationYear} with a GPA of ${gpa}.\n\n${additionalInfo}\n\nPhysical Attributes:\n- Height: ${height}\n- Weight: ${weight}\n\nYou can view my highlight video here: ${highlightLink}\n\nThank you for your consideration. I believe my skills and dedication would make me a valuable addition to your program.\n\nBest regards,\n${name}`
      };
    }

    res.json({
      success: true,
      subject: emailData.subject,
      email: emailData.email,
      message: "Email template generated successfully"
    });

  } catch (error) {
  console.error("Error generating email:", error.message);

  // Fallback email template
  const fallbackEmail = {
    subject: "College Recruitment Interest - Student Athlete",
    email: `
Dear Coach,

I hope you are doing well. My name is ${req.body.name}, and I am a dedicated ${req.body.position} currently playing for ${req.body.school}. I will be graduating in ${req.body.graduationYear}.

Here are a few quick highlights:
- GPA: ${req.body.gpa}
- Height: ${req.body.height}
- Weight: ${req.body.weight}

Highlight Video:
${req.body.highlightLink}

Additional Information:
${req.body.additionalInfo}

I would be honored to be considered for an opportunity within your program. Thank you for your time and consideration.

Best regards,
${req.body.name}
    `.trim()
  };

  return res.status(200).json({
    success: true,
    subject: fallbackEmail.subject,
    email: fallbackEmail.email,
    message: "Email generated using fallback template due to an API error"
  });
}}