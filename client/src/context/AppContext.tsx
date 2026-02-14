import { createContext, useContext, useEffect, useState } from "react";
import { initialState, type ActivityEntry, type Credentials, type FoodEntry, type User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../configs/api";
import toast from "react-hot-toast";

// --- App context
const AppContext = createContext(initialState);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isUserFetched, setIsUserFetched] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [allFoodLogs, setAllFoodLogs] = useState<FoodEntry[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityEntry[]>([]);

  // Utility to set/remove auth header
  const setAuthHeader = (token: string | null) => {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
  };

  // --- Authentication
  const signup = async (credentials: Credentials) => {
    try {
      const { data } = await api.post("/api/auth/local/register", credentials);
      setUser({ ...data.user, token: data.jwt });
      if (data.user?.age && data.user?.weight && data.user?.goal) setOnboardingCompleted(true);
      localStorage.setItem("token", data.jwt);
      setAuthHeader(data.jwt);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.response?.data?.error?.message || error?.message || "Signup failed");
    }
  };

  const login = async (credentials: Credentials) => {
    try {
      const { data } = await api.post("/api/auth/local", {
        identifier: credentials.email,
        password: credentials.password,
      });
      setUser({ ...data.user, token: data.jwt });
      if (data.user?.age && data.user?.weight && data.user?.goal) setOnboardingCompleted(true);
      localStorage.setItem("token", data.jwt);
      setAuthHeader(data.jwt);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.response?.data?.error?.message || error?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setOnboardingCompleted(false);
    setAuthHeader(null);
    navigate("/");
  };

  // --- Fetchers with safe error handling
  const fetchUser = async (token: string) => {
    setAuthHeader(token);
    try {
      const { data } = await api.get("/api/users/me");
      setUser({ ...data, token });
      if (data?.age && data?.weight && data?.goal) setOnboardingCompleted(true);
    } catch (error: any) {
      console.warn("fetchUser failed — server may be offline", error.message);
      setUser(null);
    } finally {
      setIsUserFetched(true);
    }
  };

  const fetchFoodLogs = async (token: string) => {
    setAuthHeader(token);
    try {
      const { data } = await api.get("/api/food-logs");
      setAllFoodLogs(data);
    } catch (error: any) {
      console.warn("fetchFoodLogs failed — server may be offline", error.message);
      setAllFoodLogs([]);
    }
  };

  const fetchActivityLogs = async (token: string) => {
    setAuthHeader(token);
    try {
      const { data } = await api.get("/api/activity-logs");
      setAllActivityLogs(data);
    } catch (error: any) {
      console.warn("fetchActivityLogs failed — server may be offline", error.message);
      setAllActivityLogs([]);
    }
  };

  // --- Init on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsUserFetched(true); // no token, safe fallback
      return;
    }

    // Fetch all data in parallel — failures won't break the app
    (async () => {
      await Promise.all([fetchUser(token), fetchFoodLogs(token), fetchActivityLogs(token)]);
    })();
  }, []);

  const value = {
    user,
    setUser,
    isUserFetched,
    fetchUser,
    signup,
    login,
    logout,
    onboardingCompleted,
    setOnboardingCompleted,
    allFoodLogs,
    allActivityLogs,
    setAllFoodLogs,
    setAllActivityLogs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
