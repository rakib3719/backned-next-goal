
import EmailTemplate from "../models/EmailTemplateModel.js";

export const saveEmailTemplate = async (req, res) => {

    console.log(req.body, "homagara kha rakib madari")
  try {
    const { user, email, subject, body, raw, name } = req.body;

    // Validate fields
    if (!user || !email || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "User, email, subject, and body fields are required.",
      });
    }

    // Create new template
    const newTemplate = await EmailTemplate.create({
      user,
      email,
      name,
      template: {
        subject,
        body,
        raw: raw || `${subject}\n\n${body}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Email template saved successfully.",
      data: newTemplate,
    });

  } catch (error) {
    console.error("Template Save Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save email template.",
      error: error.message,
    });
  }

};





export const getMyTemplate = async(req, res)=>{
    try {
        const email = req.params.email;
        const template = await EmailTemplate.find({email:email});

        res.status(200).json({
            message:"Success",
            data:template
        })
        
    } catch (error) {
        res.status(500).json({
            error,
            message:error?.message
        })
    }
}



export const editTemplate = async(req, res)=>{
    try {
        const {id, sub, body, raw} = req.body;
        
        const updated = await EmailTemplate.updateOne(
            { _id: id },
            { 
                $set: {
                    "template.subject": sub,
                    "template.body": body,
                    "template.raw": raw || `${sub}\n\n${body}`
                } 
            }
        );

        res.status(200).json({
            message:"Success",
            data:updated
        })
        
    } catch (error) {
        res.status(500).json({
            error,
            message:error?.message
        })
    
    
    
    }
}

export const templateDelete = async(req, res)=>{
    try {

        const id = req.params.id;
        const deleted = await EmailTemplate.deleteOne({_id:id});
        res.status(200).json({
            message:"Success",
            data:deleted

        })
        
    } catch (error) {

        console.log(error, "this is error of rakib vudai")
        res.status(500).json({
            error,
            message:error?.message
        })
    }
}