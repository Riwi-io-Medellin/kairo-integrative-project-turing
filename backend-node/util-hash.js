import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

export { hashPassword, verifyPassword };
