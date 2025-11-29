import Coach from "../models/CoachModel.js";

export const saveCoach = async(req, res)=>{
    try {

        const data = req.body;

        const newCoach = new Coach(data);
       const saved =  await newCoach.save();

       res.status(200).json({

        message:"Success",
        data:saved
       })
        
    } catch (error) {
        res.status(500).json({
            error,
            message:error?.message
        })
        
 
    }
};

export const editCoach = async (req, res) => {
try {
const { id } = req.params; // Assume the coach ID is sent in the URL
const { data } = req.body; // 'data' contains the fields to update

if (!id) {
  return res.status(400).json({ message: "Coach ID is required" });
}

// Find the coach by ID and update
const updatedCoach = await Coach.findByIdAndUpdate(
  id,
  { $set: data }, // Update only the provided fields
  { new: true, runValidators: true } // Return the updated document & validate
);

if (!updatedCoach) {
  return res.status(404).json({ message: "Coach not found" });
}

res.status(200).json({
  message: "Coach updated successfully",
  coach: updatedCoach,
});

} catch (error) {
res.status(500).json({
message: "Failed to update coach",
error: error.message,
});
}
};



export const deleteCoach = async(req, res)=>{
    try {

        const id = req.params.id;
        const deleted = await Coach.deleteOne({_id:id});
        res.status(200).json({
            message:"Success",
            data: deleted
        })
        
    } catch (error) {
        res.status(500).json({
            error,
            message:error.message
        })
    }
};



export const getAllCoach = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      gender = "",
      division = "",
      conference = ""
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (gender) filter.gender = gender;
    if (division) filter.division = division;
    if (conference) filter.conference = conference;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const data = await Coach.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Coach.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: "Success",
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCoaches: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      error,
      message: error?.message
    });
  }
};




export const getAllConferences = async(req, res)=>{
    try {
        const allConferences = await Coach.find();

     
        
    } catch (error) {
        res.status(500).json({
            error,
            message:error.message
        })
    }
}