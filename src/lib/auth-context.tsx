import { createContext, useContext, useState, useEffect } from "react";
import {
  account,
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  ID,
  Query,
  functions,
} from "./appwrite";
import { OAuthProvider } from "appwrite";
import { redirect } from "@tanstack/react-router";
import { getUserRank } from "@/services/leaderboard.service";

export interface User {
  $id: string;
  name: string;
  email?: string;
  phoneNo?: string;
  Class: string;
  District: string;
  points: number;
  streak: number;
  badges: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    Class: string,
    District: string,
    phoneNo: string
  ) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  handleOAuthCallback: () => Promise<User>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<User | null>;
  checkUserStatus: () => Promise<void>;
  getRank: () => Promise<number | null>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    userId: string,
    secret: string,
    newPassword: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const getUserData = async (userId: string): Promise<User | null> => {
    try {
      const userData = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("$id", userId)]
      );

      if (userData.documents.length > 0) {
        const document = userData.documents[0];
        return {
          name: document.name,
          email: document.email,
          phoneNo: document.phoneNo || "",
          Class: document.Class || "",
          District: document.District || "",
          points: document.points || 0,
          streak: document.streak || 0,
          badges: document.badges || [],
          ...document,
        } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data", error);
      return null;
    }
  };

  const ensureUserDocumentExists = async (
    userId: string,
    name: string,
    email?: string,
    Class?: string,
    District?: string,
    phoneNo?: string
  ): Promise<User> => {
    let userData = await getUserData(userId);
    if (userData) return userData;

    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        {
          name,
          email,
          phoneNo: phoneNo || "",
          Class: Class || "",
          District: District || "",
          points: 0,
          streak: 0,
          badges: [],
        }
      );

      return {
        name: document.name,
        email: document.email,
        phoneNo: document.phoneNo || "",
        Class: document.Class || "",
        District: document.District || "",
        points: document.points || 0,
        streak: document.streak || 0,
        badges: document.badges || [],
        ...document,
      } as User;
    } catch (error: any) {
      if (error.code === 409) {
        console.warn("Document already exists. Fetching existing document.");
        const existingUserData = await getUserData(userId);
        if (existingUserData) return existingUserData;
      }
      console.error("Failed to ensure user document", error);
      throw error;
    }
  };

  const checkUserStatus = async () => {
    try {
      const session = await account.getSession("current");
      if (session) {
        const accountDetails = await account.get();
        const userData = await ensureUserDocumentExists(
          accountDetails.$id,
          accountDetails.name,
          accountDetails.email
        );
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Session not found", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    Class: string,
    District: string,
    phoneNo: string
  ): Promise<User> => {
    try {
      setLoading(true);

      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      await account.createEmailPasswordSession(email, password);
      const PhoneWithIndian = "+91" + phoneNo;
      await account.updatePhone(PhoneWithIndian, password);
      const userData = await ensureUserDocumentExists(
        newAccount.$id,
        name,
        email,
        Class,
        District,
        phoneNo
      );

      setUser(userData);
      setIsAuthenticated(true);
      console.log("User registered and logged in:", userData);
      console.log("User ID:", userData.$id);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      functions.createExecution(
        "6811050a0016f9478345",
        JSON.stringify({ userId: userData.$id })
      );

      return userData;
    } catch (error) {
      console.error("Registration error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);

      await account.createEmailPasswordSession(email, password);
      const accountDetails = await account.get();

      const userData = await ensureUserDocumentExists(
        accountDetails.$id,
        accountDetails.name,
        accountDetails.email
      );

      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Login error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const currentUrl = window.location.origin;
      console.log("Current URL:", currentUrl);

      account.createOAuth2Session(
        OAuthProvider.Google,
        `${currentUrl}/studytracker/dashboard`,
        `${currentUrl}/studytracker/oauth-failure`
      );
    } catch (error) {
      console.error("Google login error", error);
      throw redirect({
        to: "/oauth-failure",
        search: {
          error: "Google login failed",
          message: error,
          random: "I am here",
        },
      });
    }
  };

  const handleOAuthCallback = async (): Promise<User> => {
    try {
      setLoading(true);

      const accountDetails = await account.get();
      const userData = await ensureUserDocumentExists(
        accountDetails.$id,
        accountDetails.name,
        accountDetails.email
      );

      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("OAuth callback error", error);

      throw redirect({
        to: "/oauth-failure",
        search: { error: "OAuth login failed" },
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      await account.createRecovery(
        email,
        `${window.location.origin}/studytracker/reset-password`
      );
    } catch (error) {
      console.error("Password recovery error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<void> => {
    try {
      setLoading(true);
      await account.updateRecovery(userId, secret, newPassword);
    } catch (error) {
      console.error("Password reset error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRank = async (): Promise<number | null> => {
    try {
      if (!user) return null;
      const rank = await getUserRank(user.$id);
      return rank;
    } catch (error) {
      console.error("Error fetching rank:", error);
      return null;
    }
  };

  const updateUserData = async (data: Partial<User>): Promise<User | null> => {
    try {
      if (!user) return null;

      if (!user.phoneNo && data.phoneNo) {
        await account.updatePhone(
          data.phoneNo ? "+91" + data.phoneNo : user.phoneNo || "",
          ID.unique()
        );
      }
      const document = await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        data
      );

      const updatedUser: User = {
        ...user,
        ...document,
      };

      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Update user error", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    loginWithGoogle,
    handleOAuthCallback,
    logout,
    updateUserData,
    checkUserStatus,
    getRank,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
