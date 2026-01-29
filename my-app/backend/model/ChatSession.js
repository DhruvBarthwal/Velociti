import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  messages: [messageSchema],
}, { timestamps: true }); 

export default mongoose.model('ChatSession', chatSessionSchema);
