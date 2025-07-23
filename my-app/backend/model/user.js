import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    googleId : String,
    name : String,
    email : String,
    picture : String,
    createdAt:{
        type : Date,
        default : Date.now,
    },
});

export default mongoose.model('User', userSchema);