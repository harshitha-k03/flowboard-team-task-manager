const { OAuth2Client } = require("google-auth-library");
const AppError = require("./AppError");

let googleClient;

const getGoogleClientId = () => (process.env.GOOGLE_CLIENT_ID || "").trim();

const getGoogleClient = () => {
  if (!googleClient) {
    googleClient = new OAuth2Client();
  }

  return googleClient;
};

const verifyGoogleCredential = async (credential) => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new AppError(503, "Google authentication is not configured.");
  }

  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: clientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new AppError(401, "Unable to verify your Google account.");
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || payload.email.split("@")[0],
      avatar: payload.picture || undefined
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Unable to verify your Google account.");
  }
};

module.exports = {
  getGoogleClientId,
  verifyGoogleCredential
};
