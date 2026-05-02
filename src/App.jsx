import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Book from './pages/Book'
import Survey from './pages/Survey'
import ThankYou from './pages/ThankYou';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ListingTracker from './pages/ListingTracker';
import ToolsHome from './pages/ToolsHome';
import RealtorOutreach from './pages/RealtorOutreach';

function App() {
  return (
    <Router>
      <div className="app-container fade-in">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/book" element={<Book />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route path="/terms-of-service" element={<Terms />} />
            <Route path="/tools" element={<ToolsHome />} />
            <Route path="/listing-tracker" element={<ListingTracker />} />
            <Route path="/realtor-outreach" element={<RealtorOutreach />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
