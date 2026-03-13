import { Link } from 'react-router-dom';
import './Home.css';

export default function Privacy() {
    return (
        <div className="home-page">
            <header className="home-header" style={{ position: 'relative', background: 'var(--bg-primary)' }}>
                <div className="container header-container">
                    <div className="logo-container">
                        <span className="logo-text">Raphael Lemire</span>
                    </div>
                    <nav>
                        <Link to="/" className="btn-secondary">Back to Home</Link>
                    </nav>
                </div>
            </header>

            <main className="container" style={{ padding: '80px 0', maxWidth: '800px', flex: 1 }}>
                <h1 style={{ marginBottom: '24px', fontSize: '2.5rem' }}>Privacy Policy</h1>
                <div className="glass-panel" style={{ padding: '40px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '16px' }}><strong>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    <p style={{ marginBottom: '16px' }}>
                        Raphael Lemire | EXIT Realty Associates ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our website and services.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>1. Information We Collect</h2>
                    <p style={{ marginBottom: '16px' }}>
                        We collect information you provide directly to us, such as when you fill out a form, request a consultation, or communicate with us. This may include your name, email address, phone number, and any other details you choose to provide.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>2. How We Use Your Information</h2>
                    <p style={{ marginBottom: '16px' }}>
                        We use the information we collect to securely schedule appointments, communicate with you about real estate listings, and improve our services.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>3. Information Sharing</h2>
                    <p style={{ marginBottom: '16px' }}>
                        We do not share your personal information with third parties except as necessary to provide our services or as required by law.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>4. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:raphael@exitmoncton.ca" style={{ color: 'var(--text-primary)' }}>raphael@exitmoncton.ca</a>.
                    </p>
                </div>
            </main>

            <footer className="home-footer">
                <p>&copy; {new Date().getFullYear()} Raphaël Lemire | EXIT Realty Associates | Moncton, NB</p>
            </footer>
        </div>
    );
}
