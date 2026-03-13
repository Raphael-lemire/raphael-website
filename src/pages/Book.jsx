import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import './Book.css';

export default function Book() {
    const navigate = useNavigate();
    const [hasBooked, setHasBooked] = useState(false);

    useEffect(() => {
        // Inject the GoHighLevel script for iframe resizing when the component mounts
        const script = document.createElement('script');
        script.src = "https://link.brokeragenation.com/js/form_embed.js";
        script.type = "text/javascript";
        script.async = true;
        document.body.appendChild(script);

        // Listen for the GoHighLevel appointment booking event
        const handleMessage = (e) => {
            if (e.data) {
                // Log for debugging
                console.log("Iframe message received:", e.data);

                let data = e.data;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        // ignore parse error if it's just a regular string
                    }
                }

                // Check common GHL calendar booking footprints
                const isBookingSuccess =
                    data === 'appointment-created' ||
                    data === 'booking-success' ||
                    data === 'msgsndr-booking-complete' ||
                    (Array.isArray(data) && data.includes('msgsndr-booking-complete')) ||
                    (data && (data.message === 'appointment-created' || data.message === 'msgsndr-booking-complete')) ||
                    (data && (data.action === 'appointment-created' || data.action === 'msgsndr-booking-complete')) ||
                    (data && typeof data.message === 'string' && (data.message.includes('appoint') || data.message.includes('book')));

                if (isBookingSuccess) {
                    console.log("✅ BOOKING DETECTED - REVEALING DONE BUTTON");
                    setHasBooked(true);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            // Cleanup the script and listener when the component unmounts to prevent duplicates
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            window.removeEventListener('message', handleMessage);
        };
    }, [navigate]);

    return (
        <div className="book-page">
            <header className="book-header">
                <div className="container">
                    <Link to="/" className="back-link">
                        &larr; Back to Overview
                    </Link>
                </div>
            </header>

            <main className="book-content container fade-in slide-up">
                <ProgressBar currentStep={2} />
                <h1>Schedule Your Viewing</h1>
                <p className="book-subtitle">Select a time that works best for you. Our agent will confirm shortly.</p>

                <div className="embed-container glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <iframe
                        src="https://link.brokeragenation.com/widget/booking/m1nSKgK0Zc86d2PxUSiq"
                        style={{ width: '100%', height: '800px', border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        id="m1nSKgK0Zc86d2PxUSiq_1772766000043"
                        title="Schedule a Viewing"
                    ></iframe>
                </div>
                <div className="legal-links" style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Link to="/privacy-policy" className="link">Privacy Policy</Link> | <Link to="/terms-of-service" className="link">Terms of Service</Link>
                </div>
                {hasBooked && (
                    <div className="book-actions fade-in" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <Link to="/thank-you" className="btn-primary done-btn">
                            Done &rarr;
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
