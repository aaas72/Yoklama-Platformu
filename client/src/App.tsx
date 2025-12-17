import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import RegisterSchool from "./pages/RegisterSchool";
import PrivateRoute from "./components/PrivateRoute";
import Overview from "./pages/dashboard/Overview";
import Students from "./pages/dashboard/Students";
import Teachers from "./pages/dashboard/Teachers";
import Classes from "./pages/dashboard/Classes";
import AddStudent from "./pages/dashboard/AddStudent";
import AddTeacher from "./pages/dashboard/AddTeacher";
import AddClass from "./pages/dashboard/AddClass";
import AttendanceScanner from "./pages/AttendanceScanner";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register-school" element={<RegisterSchool />} />
      <Route path="/login" element={<Login />} />
      <Route path="/attendance-scanner" element={<AttendanceScanner />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/edit/:id" element={<AddStudent />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/add" element={<AddTeacher />} />
        <Route path="teachers/edit/:id" element={<AddTeacher />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/add" element={<AddClass />} />
        <Route path="classes/edit/:id" element={<AddClass />} />
      </Route>
    </Routes>
  );
}

export default App;
