import { MultiStepForm } from "@/components/forms/MultiStepForm";
import { SearchForm } from "@/components/forms/SearchForm";
import { TextForm } from "@/components/forms/TextForm";
import { UnusualForm } from "@/components/forms/UnusualForm";
import { UserDataForm } from "@/components/forms/UserDataForm";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/ui/tabs";

const App = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Form Benchmark Testing Suite</CardTitle>
            <CardDescription>
              A comprehensive collection of diverse forms for testing form
              filling automation
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="search">
          <TabList>
            <Tab value="search">Search Form</Tab>
            <Tab value="text">Text Form</Tab>
            <Tab value="unusual">Unusual Inputs</Tab>
            <Tab value="user">User Data</Tab>
            <Tab value="multistep">Multi-Step</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="search">
              <SearchForm />
            </TabPanel>
            <TabPanel value="text">
              <TextForm />
            </TabPanel>
            <TabPanel value="unusual">
              <UnusualForm />
            </TabPanel>
            <TabPanel value="user">
              <UserDataForm />
            </TabPanel>
            <TabPanel value="multistep">
              <MultiStepForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default App;
