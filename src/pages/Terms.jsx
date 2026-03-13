import { Link } from 'react-router-dom';
import './Home.css';

export default function Terms() {
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
                <h1 style={{ marginBottom: '24px', fontSize: '2.5rem' }}>Terms of Service</h1>
                <div className="glass-panel" style={{ padding: '40px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '16px' }}><strong>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    <p style={{ marginBottom: '16px' }}>
                        Welcome! These Terms of Service ("Terms") govern your use of the Raphael Lemire | EXIT Realty Associates website and services.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
                    <p style={{ marginBottom: '16px' }}>
                        By accessing or using our website, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>2. Use of Services</h2>
                    <p style={{ marginBottom: '16px' }}>
                        You agree to use our services only for lawful purposes. The content provided on this website is for informational purposes only and does not substitute for professional real estate advice.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>3. Limitation of Liability</h2>
                    <p style={{ marginBottom: '16px' }}>
                        Raphael Lemire and EXIT Realty Associates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>4. Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these terms at any time. Your continued use of the website following any changes indicates your acceptance of the new Terms.
                    </p>
                </div>
            </main>

            <footer className="home-footer">
                <p>&copy; {new Date().getFullYear()} Raphaël Lemire | EXIT Realty Associates | Moncton, NB</p>
            </footer>
        </div>
    );
}
