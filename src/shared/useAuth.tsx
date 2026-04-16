import React from "react";
import { db } from "./src/db/client.js";
import { users } from "./src/db/schema.js";
import { logger } from "./src/logger.js";
import { sql } from "drizzle-orm";

type User = {
  id: number;
  username: string;
  pin: string;
  name: string;
  role: "admin" | "cashier";
  active: number;
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  
  const login = React.useCallback((username: string, pin: string): boolean => {
    const dbUsers = db.select().from(users).where(sql`active = 1`).all();
    const validUser = dbUsers.find(
      (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin && u.active === 1
    );

    if (validUser) {
      setIsAuthenticated(true);
      setUser(validUser as User);
      return true;
    }

    return false;
  }, []);

  const logout = React.useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isAuthenticated, user, login, logout };
}