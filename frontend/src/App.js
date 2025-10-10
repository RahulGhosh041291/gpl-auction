import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Registration from './pages/Registration/Registration';
import TeamRegistration from './pages/TeamRegistration/TeamRegistration';
import OwnerRegistration from './pages/OwnerRegistration/OwnerRegistration';
import Players from './pages/Players/Players';
import PlayerProfile from './pages/PlayerProfile/PlayerProfile';
import Teams from './pages/Teams/Teams';
import LiveAuction from './pages/LiveAuction/LiveAuction';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentCancel from './pages/Payment/PaymentCancel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/registration/success" element={<PaymentSuccess />} />
          <Route path="/registration/cancel" element={<PaymentCancel />} />
          <Route path="/team-registration" element={<TeamRegistration />} />
          <Route path="/owner-registration" element={<OwnerRegistration />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<Teams />} />
          <Route path="/auction" element={
            <ProtectedRoute>
              <LiveAuction />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
