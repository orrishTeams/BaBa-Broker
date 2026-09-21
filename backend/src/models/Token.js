import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['access', 'refresh'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true, versionKey: false }
);


export default mongoose.models.Token || mongoose.model('Token', tokenSchema);
