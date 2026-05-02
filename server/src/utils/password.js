const bcrypt = require("bcrypt");

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

const isHashedPassword = (value = "") => BCRYPT_HASH_PATTERN.test(value);

const hashPassword = async (password) => bcrypt.hash(password, 10);

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  if (!isHashedPassword(hashedPassword)) {
    return plainPassword === hashedPassword;
  }

  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  isHashedPassword,
  hashPassword,
  comparePassword
};
