const User = require("../models/User");
const { comparePassword, hashPassword, isHashedPassword } = require("./password");

const demoUsers = [
  {
    name: "Admin",
    email: "admin@flowboard.com",
    password: "123456",
    role: "admin"
  },
  {
    name: "Member",
    email: "member@flowboard.com",
    password: "123456",
    role: "member"
  }
];

const shouldAutoSeedDemoUsers = () => process.env.AUTO_SEED_DEMO_USERS !== "false";

const ensureDemoUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!existingUser) {
    const hashedPassword = await hashPassword(password);

    await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    console.log(`Demo user created: ${normalizedEmail}`);
    return;
  }

  let shouldSave = false;

  if (existingUser.role !== role) {
    existingUser.role = role;
    shouldSave = true;
  }

  if (!existingUser.name) {
    existingUser.name = name;
    shouldSave = true;
  }

  const passwordMatches = await comparePassword(password, existingUser.password);

  if (!passwordMatches || !isHashedPassword(existingUser.password)) {
    existingUser.password = await hashPassword(password);
    shouldSave = true;
  }

  if (shouldSave) {
    await existingUser.save();
    console.log(`Demo user updated: ${normalizedEmail}`);
  }
};

const ensureDemoUsers = async () => {
  if (!shouldAutoSeedDemoUsers()) {
    return;
  }

  for (const demoUser of demoUsers) {
    await ensureDemoUser(demoUser);
  }
};

module.exports = {
  ensureDemoUsers
};
