import { useState, ReactNode, createContext, useContext } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
}

export const Tabs = ({ defaultValue, children }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: ReactNode;
}

export const TabList = ({ children }: TabListProps) => {
  return (
    <div className="flex border-b mb-4">
      {children}
    </div>
  );
};

interface TabProps {
  value: string;
  children: ReactNode;
}

export const Tab = ({ value, children }: TabProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab must be used within Tabs");

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
};

interface TabPanelsProps {
  children: ReactNode;
}

export const TabPanels = ({ children }: TabPanelsProps) => {
  return <div>{children}</div>;
};

interface TabPanelProps {
  value: string;
  children: ReactNode;
}

export const TabPanel = ({ value, children }: TabPanelProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabPanel must be used within Tabs");

  const { activeTab } = context;
  const isActive = activeTab === value;

  return (
    <div className={isActive ? "block" : "hidden"}>
      {children}
    </div>
  );
};
