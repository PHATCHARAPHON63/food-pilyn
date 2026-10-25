// ============================================
// Mongoose Model: User
// สำหรับเก็บข้อมูลแอดมิน/คนขับ
// ============================================
import mongoose, { Schema, model, models } from 'mongoose';
import { genSalt, hash, compare } from 'bcryptjs';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  role: 'admin' | 'driver';
  createdAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = mongoose.Model<IUser, Record<string, never>, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'driver'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

/**
 * Hash password ก่อนบันทึก ถ้ามีการแก้ไข password
 */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);
});

/**
 * Method เปรียบเทียบ password ที่กรอกเข้ามากับที่เก็บไว้
 */
UserSchema.method('comparePassword', async function (candidatePassword: string) {
  return compare(candidatePassword, this.password);
});

const User = (models.User as UserModel) || model<IUser, UserModel>('User', UserSchema);
export default User;
