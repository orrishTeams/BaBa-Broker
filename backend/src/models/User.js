import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
    phone: { type: String, trim: true, default: '', index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'salesman', 'employee'], required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);


userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

export default mongoose.models.User || mongoose.model('User', userSchema);
