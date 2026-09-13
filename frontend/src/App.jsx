import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Screener from "./pages/Screener.jsx";
import Technical from "./pages/Technical.jsx";
import Sentiment from "./pages/Sentiment.jsx";
import DCF from "./pages/DCF.jsx";
import Variance from "./pages/Variance.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/technical" element={<Technical />} />
        <Route path="/sentiment" element={<Sentiment />} />
        <Route path="/dcf" element={<DCF />} />
        <Route path="/variance" element={<Variance />} />
      </Routes>
    </Layout>
  );
}
