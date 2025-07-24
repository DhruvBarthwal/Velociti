import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' }, // default if no user logged in
  messages: [messageSchema],
}, { timestamps: true }); // Automatically add createdAt & updatedAt

export default mongoose.model('ChatSession', chatSessionSchema);
