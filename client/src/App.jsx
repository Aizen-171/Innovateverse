import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

import { LandingPage } from './pages/LandingPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { SubmitIdeaPage } from './pages/SubmitIdeaPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ShowcasePage } from './pages/ShowcasePage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { ReviewsDashboardPage } from './pages/ReviewsDashboardPage';
import { ProfileModal } from './components/ProfileModal';

function MainApp() {
  const [activePage, setActivePage] = useState('landing');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Reviewer Demo Persona Switcher Banner */}
      <DemoBanner />

      {/* 2. Editorial Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        openAuthModal={() => setAuthOpen(true)}
        openProfileModal={() => setProfileOpen(true)}
      />

      {/* 3. Main Page Routing Container */}
      <main className="main-content" role="main">
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            setSelectedProject={setSelectedProject}
            setSelectedChallenge={setSelectedChallenge}
          />
        )}

        {activePage === 'explorer' && (
          <ExplorerPage
            setActivePage={setActivePage}
            setSelectedProject={setSelectedProject}
          />
        )}

        {activePage === 'challenges' && (
          <ChallengesPage
            setActivePage={setActivePage}
            setSelectedChallenge={setSelectedChallenge}
          />
        )}

        {activePage === 'submit-idea' && (
          <SubmitIdeaPage
            setActivePage={setActivePage}
            setSelectedProject={setSelectedProject}
            initialChallenge={selectedChallenge}
          />
        )}

        {activePage === 'workspace' && (
          <WorkspacePage
            setActivePage={setActivePage}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            openProfileModal={() => setProfileOpen(true)}
          />
        )}

        {activePage === 'reviews' && (
          <ReviewsDashboardPage
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'showcase' && (
          <ShowcasePage
            setActivePage={setActivePage}
            setSelectedProject={setSelectedProject}
          />
        )}

        {activePage === 'project-details' && (
          <ProjectDetailsPage
            project={selectedProject}
            setActivePage={setActivePage}
            setSelectedProject={setSelectedProject}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer setActivePage={setActivePage} />

      {/* 5. Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* 6. Student Skill Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
