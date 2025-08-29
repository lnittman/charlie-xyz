"use client";

import { createContext, useContext } from "react";

interface AuthenticatedData {
  user: any;
  radars: any[];
}

const AuthenticatedDataContext = createContext<AuthenticatedData | null>(null);

export function AuthenticatedDataProvider({ 
  children, 
  data 
}: { 
  children: React.ReactNode;
  data: AuthenticatedData;
}) {
  return (
    <AuthenticatedDataContext.Provider value={data}>
      {children}
    </AuthenticatedDataContext.Provider>
  );
}

export function useAuthenticatedData() {
  const context = useContext(AuthenticatedDataContext);
  if (!context) {
    throw new Error("useAuthenticatedData must be used within AuthenticatedDataProvider");
  }
  return context;
}