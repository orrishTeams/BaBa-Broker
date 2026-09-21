import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const BOOTSTRAP_ACCOUNTS = [
  {
    name: 'Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@bababroker.com').trim().toLowerCase(),
    phone: '9586505111',
    password: process.env.ADMIN_PASSWORD || 'Baba@123',
    role: 'admin',
  },
  {
    name: 'Salesman',
    email: (process.env.SALESMAN_EMAIL || 'salesman@bababroker.com').trim().toLowerCase(),
    phone: '9891140379',
    password: process.env.SALESMAN_PASSWORD || 'Baba@123',
    role: 'salesman',
  },
  {
    name: 'Employee',
    email: (process.env.EMPLOYEE_EMAIL || 'employee@bababroker.com').trim().toLowerCase(),
    phone: process.env.EMPLOYEE_PHONE || '9319290979',
    password: process.env.EMPLOYEE_PASSWORD || 'Baba@123',
    role: 'employee',
  },
];

let seeded = false;

export async function ensureBootstrapUsers() {
  if (seeded) return;
  try {
    for (const acc of BOOTSTRAP_ACCOUNTS) {
      let user = await User.findOne({ email: acc.email });
      if (!user && acc.phone) {
        user = await User.findOne({ phone: acc.phone });
      }

      if (!user) {
        const passwordHash = await bcrypt.hash(acc.password, 10);
        await User.create({
          name: acc.name,
          email: acc.email,
          phone: acc.phone,
          passwordHash,
          role: acc.role,
          isActive: true,
          tokenVersion: 0,
          loginAttempts: 0,
        });
        console.log(`Bootstrap ${acc.role} account created: ${acc.email}`);
      } else {
        user.name = acc.name;
        user.email = acc.email;
        user.role = acc.role;
        user.phone = acc.phone;
        user.isActive = true;
        user.lockUntil = null;
        user.loginAttempts = 0;
        user.passwordHash = await bcrypt.hash(acc.password, 10);
        await user.save();
        console.log(`Bootstrap ${acc.role} account updated: ${acc.email}`);
      }
    }
    seeded = true;
  } catch (err) {
    console.error('Error ensuring bootstrap users:', err);
  }
}
