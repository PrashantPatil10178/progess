import { createContext, useContext, useState, useEffect } from "react";
import {
  account,
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  ID,
  Query,
} from "./appwrite";
import { OAuthProvider } from "appwrite";

interface User {
  $id: string;
  name: string;
  email?: string;
  Class: string; // Note the capital 'C' to match database
  District: string; // Note the capital 'D' to match database
  points: number;
  streak: number;
  badges: string[];
  profilePicture: string;
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
    District: string
  ) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  handleOAuthCallback: () => Promise<User>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<User | null>;
  checkUserStatus: () => Promise<void>;
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
          Class: document.Class || "",
          District: document.District || "",
          points: document.points || 0,
          streak: document.streak || 0,
          badges: document.badges || [],
          profilePicture: document.profilePicture || "",
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
    District?: string
  ): Promise<User> => {
    let userData = await getUserData(userId);
    if (userData) return userData;

    const document = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        name,
        email,
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
      Class: document.Class,
      District: document.District,
      points: document.points,
      streak: document.streak,
      badges: document.badges,
      profilePicture: document.profilePicture || "",
      ...document,
    } as User;
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
    District: string
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

      const userData = await ensureUserDocumentExists(
        newAccount.$id,
        name,
        email,
        Class,
        District
      );

      setUser(userData);
      setIsAuthenticated(true);

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
      account.createOAuth2Session(
        OAuthProvider.Google,
        `${currentUrl}/dashboard`,
        `${currentUrl}/login-failed`
      );
    } catch (error) {
      console.error("Google login error", error);
      throw error;
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
      throw error;
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

  const updateUserData = async (data: Partial<User>): Promise<User | null> => {
    try {
      if (!user) return null;

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
