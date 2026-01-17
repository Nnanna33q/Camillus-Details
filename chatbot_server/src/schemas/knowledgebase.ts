import mongoose from "mongoose";

const kbSchema = new mongoose.Schema({
    text: String,
    category: String,
    vector: [Number]
}, { timestamps: true })

const Kb = mongoose.model('Kb', kbSchema);
export default Kb;