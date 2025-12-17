import React, { useState, useEffect, type ReactNode } from "react";
import { AuthContext, type User } from "./auth";
import { login as loginService, getCurrentUser } from "../services/authService";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    if (token) {
      if (!user) {
        (async () => {
          try {
            const fetched = await getCurrentUser();
            setUser(fetched);
            localStorage.setItem("user", JSON.stringify(fetched));
          } catch {
            const partialUser: User = {
              id: 0,
              username: "",
              role: "admin",
              school_id: 0,
            };
            setUser(partialUser);
            localStorage.setItem("user", JSON.stringify(partialUser));
          }
        })();
      }
    }
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const data = await loginService(username, password);
      const { access_token } = data;

      setToken(access_token);
      localStorage.setItem("token", access_token);

      // Fetch full user details
      try {
        const user = await getCurrentUser();
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (userError) {
        console.error("Failed to fetch user details:", userError);
        const partialUser = {
          id: 0, // Unknown
          username: data.username,
          role: data.role,
          school_id: data.school_id,
        };
        setUser(partialUser);
        localStorage.setItem("user", JSON.stringify(partialUser));
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
