import mongoose from 'mongoose';
import Random from 'meteor-random';
import bcrypt from 'bcrypt';
import { ROLES } from '../../data/constants';

const SALT_WORK_FACTOR = 10;

// Detail schema
const DetailSchema = mongoose.Schema(
  {
    avatar: String,
    fullName: String,
    position: String,
    twitterUsername: String,

    // channels to invite
    channelIds: {
      type: [String],
      optional: true,
    },

    signatures: {
      brandId: String,
      signature: String,
    },
  },
  { _id: false },
);

// User schema
const UserSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => Random.id(),
  },
  username: String,
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: {
    type: String,
    enum: [ROLES.ADMIN, ROLES.CONTRIBUTOR],
  },
  details: DetailSchema,
  isOwner: Boolean,
  email: {
    type: String,
    lowercase: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
});

class User {
  /**
   * Create new user
   * @param {Object} doc - user fields
   * @return {Promise} newly created user object
   */
  static async createUser({ username, email, password, role, details }) {
    return this.create({
      username,
      email,
      role,
      details,
      // hash password
      password: await this.generatePassword(password),
    });
  }

  /**
   * Update user information
   * @param {String} userId
   * @param {Object} doc - user fields
   * @return {Promise} updated user info
   */
  static async updateUser(_id, { username, email, password, role, details }) {
    const doc = { username, email, password, role, details };

    // change password
    if (password) {
      doc.password = await this.generatePassword(password);
    }

    await this.update({ _id }, { $set: doc });

    return this.findOne({ _id });
  }

  /*
   * Remove user
   * @param {String} _id - User id
   * @return {Promise} - remove method response
   */
  static async removeUser(_id) {
    return Users.remove({ _id });
  }

  /*
   * Generates new password hash using plan text password
   * @param {String} password - Plan text password
   * @return hashed password
   */
  static generatePassword(password) {
    return bcrypt.hash(password, SALT_WORK_FACTOR);
  }
}

UserSchema.loadClass(User);

const Users = mongoose.model('users', UserSchema);

export default Users;
