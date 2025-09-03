import React from 'react';
import { Link } from 'react-router-dom';

const TestRoutes: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Route Testing</h2>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/settings">Settings</Link></li>
        <li><Link to="/analytics">Analytics</Link></li>
        <li><Link to="/child-profiles">Child Profiles</Link></li>
        <li><Link to="/study-plans">Study Plans</Link></li>
        <li><Link to="/educational-content-demo">Educational Content & Skills Demo</Link></li>
      </ul>
    </div>
  );
};

export default TestRoutes;