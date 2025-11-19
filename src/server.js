
import { app } from './app.js'
import connectDB from './configure/db.js';




const PORT = process.env.PORT || 5000;




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


connectDB()