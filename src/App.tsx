import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
