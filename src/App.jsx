import { HashRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AgendaViewer from './components/AgendaViewer';
import EventBuilder from './components/EventBuilder';
import CompaniesPage from './components/CompaniesPage';
import EventDashboard from './components/EventDashboard';
import ExpertManager from './components/ExpertManager';
import StartupManager from './components/StartupManager';
import SubmissionManager from './components/SubmissionManager';
import StartupViewer from './components/StartupViewer';
import ExpertViewer from './components/ExpertViewer';
import CompanyPortal from './components/CompanyPortal';
import ExpertPortal from './components/ExpertPortal';

import PublicLayout from './components/PublicLayout';

import FormEditor from './components/FormEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<CompaniesPage />} />

        {/* Event Hub */}
        <Route path="/event/:eventId" element={<EventDashboard />} />
        <Route path="/event/:eventId/forms" element={<FormEditor />} />

        {/* Modules */}
        <Route path="/event/:eventId/agenda" element={<BuilderWrapper />} />
        <Route path="/event/:eventId/experts" element={<ExpertManager />} />
        <Route path="/event/:eventId/startups" element={<StartupManager />} />
        <Route path="/event/:eventId/submissions" element={<SubmissionManager />} />

        {/* Public Portal */}
        <Route element={<PublicLayout />}>
          <Route path="/agenda/:eventId" element={<ViewerWrapper />} />
          <Route path="/view/:eventId/experts" element={<ExpertViewer />} />
          <Route path="/view/:eventId/startups" element={<StartupViewer />} />
        </Route>

        {/* Registration Portals (No Authentication Required, No Layout/Nav) */}
        <Route path="/events/:eventId/register/company" element={<CompanyPortal />} />
        <Route path="/events/:eventId/register/expert" element={<ExpertPortal />} />
      </Routes>
    </Router>
  );
}

// Wrappers to handle params
function BuilderWrapper() {
  const { eventId } = useParams();
  return <EventBuilder event={{ event_id: eventId }} onBack={() => window.history.back()} />;
}

function ViewerWrapper() {
  const { eventId } = useParams();
  return <AgendaViewer eventId={eventId} />;
}


export default App;