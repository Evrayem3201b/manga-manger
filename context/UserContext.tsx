import React, {
  createContext,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";

type UserContextType = {
  username: string | null;
  setUsername: React.Dispatch<SetStateAction<string | null>>;
};
const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserRole must be inside UserRoleProvider");
  return ctx;
};

function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      username,
      setUsername,
    }),
    [username]
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export default UserContextProvider;
