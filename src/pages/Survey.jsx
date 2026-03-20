import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import logoImg from '../assets/logo.png';
import './Survey.css';

export default function Survey() {
    const navigate = useNavigate();

    useEffect(() => {
        // Inject the GoHighLevel script for the survey form when the component mounts
        const script = document.createElement('script');
        script.src = "https://link.brokeragenation.com/js/form_embed.js";
        script.type = "text/javascript";
        script.async = true;
        document.body.appendChild(script);

        // Safety flag to prevent premature redirect during the first 2 seconds of initialization
        let canRedirect = false;
        const timer = setTimeout(() => { canRedirect = true; }, 2000);

        // Listen for the GoHighLevel form submission event
        const handleMessage = (e) => {
            // Log EVERYTHING that comes through for debugging
            console.log("🔥 MESSAGE DATA 🔥", e.data);

            if (e.data && canRedirect) {
                let data = e.data;

                // If it's the GHL array format we saw
                if (Array.isArray(data)) {
                    // If it contains the form ID or specific GHL keywords indicating data update/submission
                    if (data.includes('set-sticky-contacts') || data.includes('w7VRniPbAsE0FSwuWlFp')) {
                        console.log("✅ GHL DATA UPDATED (ARRAY) - REDIRECTING...");
                        navigate('/book');
                        return;
                    }
                }

                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (err) {
                        // ignore parse error 
                    }
                }

                // Check for standard GHL submission events
                if (
                    data === 'form-submit' ||
                    data === 'ghl-form-submit' ||
                    (data && (data.type === 'form-submit' || data.type === 'ghl-form-submit' || data.message === 'form-submit')) ||
                    (typeof e.data === 'string' && e.data.toLowerCase().includes('submit'))
                ) {
                    console.log("✅ REDIRECT CONDITION MET!");
                    navigate('/book');
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            clearTimeout(timer);
            // Cleanup the script and listener when the component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            window.removeEventListener('message', handleMessage);
        };
    }, [navigate]);

    return (
        <div className="survey-page">
            <header className="survey-header">
                <div className="container header-container-survey">
                    <img src={logoImg} alt="EXIT Realty" className="survey-logo" />
                    <Link to="/" className="back-link">
                        ✕ Close
                    </Link>
                </div>
            </header>

            <main className="survey-content container fade-in slide-up">
                <ProgressBar currentStep={1} />
                <h1>Let's Build Your Strategy.</h1>
                <p className="survey-subtitle">Take 2 minutes to share your goals so we can hit the ground running on our free 15-minute intro.</p>

                <div className="embed-container glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <iframe
                        src="https://link.brokeragenation.com/widget/form/w7VRniPbAsE0FSwuWlFp"
                        style={{ width: '100%', height: '1025px', border: 'none', borderRadius: '3px' }}
                        id="inline-w7VRniPbAsE0FSwuWlFp"
                        data-layout="{'id':'INLINE'}"
                        data-trigger-type="alwaysShow"
                        data-trigger-value=""
                        data-activation-type="alwaysActivated"
                        data-activation-value=""
                        data-deactivation-type="neverDeactivate"
                        data-deactivation-value=""
                        data-form-name="Buyer / Seller intake- Core"
                        data-height="1025"
                        data-layout-iframe-id="inline-w7VRniPbAsE0FSwuWlFp"
                        data-form-id="w7VRniPbAsE0FSwuWlFp"
                        title="Buyer / Seller intake- Core"
                    >
                    </iframe>
                </div>
                <div className="survey-trust">
                    🔒 Your information is 100% secure and never shared.
                </div>
            </main>
        </div>
    );
}
