
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Stories from './pages/Stories';
import SubmitStory from './pages/SubmitStory';
import Gallery from './pages/Gallery';
import UploadPhoto from './pages/UploadPhoto';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/submit-story" element={<SubmitStory />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/upload-photo" element={<UploadPhoto />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
