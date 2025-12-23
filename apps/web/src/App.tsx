import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WelcomePage } from "@/pages/WelcomePage";
import { WebsitesPage } from "@/pages/WebsitesPage";
import { WebsiteDetailsPage } from "@/pages/WebsiteDetailsPage";
import { StatsPage } from "@/pages/StatsPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/websites" element={<WebsitesPage />} />
        <Route path="/websites/:url" element={<WebsiteDetailsPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

