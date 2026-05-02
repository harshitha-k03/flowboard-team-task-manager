import { api, unwrapResponse } from "@/lib/api";
import type { AuthPayload, AuthSession, GoogleAuthPayload, SignupPayload, UserSummary } from "@/types";

export const authService = {
  async signup(payload: SignupPayload) {
    const response = await api.post("/auth/signup", payload);
    return unwrapResponse<AuthSession>(response);
  },
  async login(payload: AuthPayload) {
    const response = await api.post("/auth/login", payload);
    return unwrapResponse<AuthSession>(response);
  },
  async googleLogin(payload: GoogleAuthPayload) {
    const response = await api.post("/auth/google", payload);
    return unwrapResponse<AuthSession>(response);
  },
  async me() {
    const response = await api.get("/auth/me");
    return unwrapResponse<{ user: UserSummary }>(response).user;
  }
};
