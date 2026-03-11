import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import Seasons from "./pages/Seasons.jsx";
import SeasonDetails from "./pages/SeasonDetails.jsx";
import Drivers from "./pages/Drivers.jsx";
import DriverDetails from "./pages/DriverDetails.jsx";
import Constructors from "./pages/Constructors.jsx";
import ConstructorDetails from "./pages/ConstructorDetails.jsx";
import Circuits from "./pages/Circuits.jsx";
import CircuitDetails from "./pages/CircuitDetails.jsx";
import Races from "./pages/Races.jsx";
import RaceDetails from "./pages/RaceDetails.jsx";
import Admin from "./pages/Admin.jsx";
import DriverAssignments from "./pages/DriverAssignments.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/seasons/:year" element={<SeasonDetails />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/drivers/:driverId" element={<DriverDetails />} />
        <Route path="/constructors" element={<Constructors />} />
        <Route path="/constructors/:constructorId" element={<ConstructorDetails />} />
        <Route path="/circuits" element={<Circuits />} />
        <Route path="/circuits/:circuitId" element={<CircuitDetails />} />
        <Route path="/races" element={<Races />} />
        <Route path="/races/:raceId" element={<RaceDetails />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/driver-assignments" element={<DriverAssignments />} />
      </Route>
    </Routes>
  );
}
