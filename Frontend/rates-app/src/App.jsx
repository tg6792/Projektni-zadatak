import { Routes, Route } from 'react-router-dom';
import RatesList from '../pages/RatesList';
import RateDetails from '../pages/RateDetails';
import Tools from '../pages/Tools';
import TrendChart from "../pages/TrendChart";
import Layout from '../components/Layout'; 

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RatesList />} />
        <Route path="/rates/:id" element={<RateDetails />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/trend" element={<TrendChart />} />
      </Routes>
    </Layout>

  );
}

export default App;
