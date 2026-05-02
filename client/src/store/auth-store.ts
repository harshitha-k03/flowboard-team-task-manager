import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/authService";
import type { AuthPayload, GoogleAuthPayload, SignupPayload, UserSummary } from "@/types";

interface AuthState {
  token: string | null;
  user: UserSummary | null;
  hydrated: boolean;
  bootstrapping: boolean;
  setAuth: (token: string, user: UserSummary) => void;
  setSession: (token: string, user: UserSummary) => void;
  clearSession: () => void;
  login: (payload: AuthPayload) => Promise<UserSummary>;
  googleLogin: (payload: GoogleAuthPayload) => Promise<UserSummary>;
  signup: (payload: SignupPayload) => Promise<UserSummary>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,
      bootstrapping: false,
      setAuth: (token, user) => set({ token, user }),
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      login: async (payload) => {
        const response = await authService.login(payload);
        get().setAuth(response.token, response.user);
        return response.user;
      },
      googleLogin: async (payload) => {
        const response = await authService.googleLogin(payload);
        get().setAuth(response.token, response.user);
        return response.user;
      },
      signup: async (payload) => {
        const response = await authService.signup(payload);
        get().setAuth(response.token, response.user);
        return response.user;
      },
      initialize: async () => {
        if (!get().token || get().bootstrapping) {
          set({ hydrated: true });
          return;
        }

        set({ bootstrapping: true });

        try {
          const user = await authService.me();
          set({ user, hydrated: true, bootstrapping: false });
        } catch {
          set({ token: null, user: null, hydrated: true, bootstrapping: false });
        }
      }
    }),
    {
      name: "flowboard-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);
