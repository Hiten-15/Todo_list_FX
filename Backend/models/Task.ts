import mongoose from 'mongoose';



const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: String,
  completed: Boolean,
  subTasks: [
    {
      _id: { type: String, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ]
});

export default mongoose.model('Task', taskSchema);
