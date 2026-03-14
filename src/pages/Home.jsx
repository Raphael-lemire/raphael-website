import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import profileImg from '../assets/profile.png';
import logoImg from '../assets/logo.png';
import appCardImg from '../assets/app-card-view.png';
import appMapImg from '../assets/app-map-view.png';

const BROWSE_LISTINGS_URL = "https://listed.inc/listings?presented-by=d8bb886f39d34c61942cf59e609cff2e&polygon=ktyxGzrdjKfgFaoBLg%2540Q%257DCSSe%2540gC%253Fc%2540_B_Eo%2540iDwAmDVk%2540eA_DAi%2540u%2540iCu%2540BUwBg%2540iBUoCmBeC%253Fi%2540j%2540aDq%2540kBE_Cu%2540cBG%257D%2540%255CgB_%2540c%2540%255BM_%2540%2540k%2540VQKDu%2540d%2540cBDaAAcAHq%2540TY%255EB%2560%2540Kq%2540iECkCL%257BARcA%2560%2540s%2540s%2540gCSuA_%2540cAqBsDmBeE_A%257DCu%2540%257DDYeDw%2540kFa%2540mB_%2540e%2540m%2540iAYsAGu%2540%2540gAVuCqAu%2540a%2540g%2540S_%2540UyAe%2540qGa%2540oCo%2540kCQi%2540y%2540qA_%2540%257B%2540k%2540u%2540_%2540s%2540e%2540uAWuAK_B%253FgAJkByAo%2540%255D%255Da%2540o%2540Ys%2540W_AKuA%2540aAcAGo%2540Qk%2540c%2540s%2540cAS_B%253FiAR%257BAf%2540u%2540X%255Bd%2540SdBg%2540%2560%2540A%257CAPbBFz%2540Xd%2540%2560%2540lAiCn%2540u%2540t%2540a%2540lAM%2560%2540MhB%257BBbBiAhBc%2540pBIdAOrA%253Fx%2540PrAt%2540f%2540d%2540r%2540bA%2560%2540fAXjBN%255EZC~Aa%2540lA%2540%2560AZjAfAf%2540RhAFt%2540InADlCzD%2560BbBjOjItBdP%257CI%257BCbAs%2540na%2540%257BNk%2540_M%257CT_Inr%2540hgA~B%2560ErDvHhDbJxChKtB~JtB%255CnF~c%2540ZDo%2540%2560I%255ExCIB~NtnA~%2560%2540pjDo%2540f%2540XdCMJdAlXn%2540dBJIx%2540%257CB%255CZRk%2540jAxAf%2540u%2540d%2540rAqApBrAdJ%2560CrA%257CDkA~JHzOsJImCxAWINE%255CDn%2540B%257CBZpCLzCLnAV~%2540DF%255CGZt%2540Bf%2540J%255CJjAh%2540dDNNPbAv%2540bAJMvAzCQPLh%2540pBrE%257CBjD%2560A~%2540VO%257C%2540lAFZ%2560%2540Zz%2540fAh%2540%255Ed%2540%257C%2540DBHMD%253Fh%2540t%2540DZTEp%2540d%2540Xf%2540OZPNN%255Bh%2540%255CGJVLBZ~AlBZh%2540l%2540V%2560CvB%255CPn%2540v%2540dBtAVHPA%2560CnCH%2540RIn%2540h%2540Vd%2540vAxAxB%257CDZ%255Eh%2540%2560%2540f%2540t%2540%2560%2540%257C%2540x%2540zC%257CB%257CETXrAfA%257CB~AxDrDhFjJLIJVPl%2540PbB%255ErBGJQSCVPb%2540PEHNhAbHn%2540hFjM~%2560%2540jErQr%2540tK%257B%2540fb%2540s%2540dMPrXm%2540j%2540tA~BH%255C%253FNOREZLp%2540H%257CA%2560%2540vD%253FxBZj%2540AP%257C%2540dGt%2540pHVhAFxALh%2540t%2540rGNn%2540RlBb%2540~Br%2540dFvBdJFr%2540%255Cl%2540nArDxBnFLr%2540l%2540vARfAxAlB%257C%2540v%2540pAzB%257CAnDNPJ%255Ep%2540tAJ%2560%2540z%2540vAnBrEf%2540z%2540RLbA%257CATj%2540p%2540h%2540JRdBdB%2560Bp%2540DZf%2540BbClBH%255E%253Fh%2540FG%2540_%2540%255E%253Fp%2540Pd%2540TfAt%2540%2560%2540b%2540%2540RRAZXNh%2540T%2560%2540bAt%2540%2560%2540d%2540JT%2540LENQJh%2540Dr%2540VvAhAtBpAhC%2560Cx%2540%2560AlD%257CCx%2540fAvC%2560FtAzCBPGLUGSJUKWFOCMH%2540DNHZATJ%2560%2540%253FPJ%255C%253FFHlA%2560Dh%2540lBVn%2540bBjGd%2540vBP%255Ep%2540%2560DAZRr%2540A%255EJFJ%255C%255ElB%253FHIDa%2540EIBMKIHCLJDHPdAP%255Er%2540z%2540tEj%2540zBb%2540jCD%2540j%2540fDVzBLh%2540LvBCDHNJzCKj%2540WJGPHI%255E%253FFfBIvAYtAEh%2540_AzCaAdCIj%2540y%2540%257CCSh%2540kAtFWx%2540o%2540dEYn%2540DXUbBD%2540OzBSt%2540%253Fj%2540IRKdAg%2540jB%2540TIPG%2540Ej%2540EN%253FZYfAK%2560A%253Fv%2540Kb%2540DDAVGj%2540Wr%2540Gp%2540MZUpBM%255E%253Fl%2540c%2540~EYbBYvDU%257CAWfKFfDp%2540hJFVVlERz%2540T%2560CZhAH%257C%2540Rp%2540l%2540zENzA%2540dAp%2540lFAf%2540TpABzAHTNxBEf%2540H%2540J%255ELjAAp%2540Jx%2540%255E~%2540TfA%255EdAp%2540rClAlEd%2540pAr%2540pCjCnG%255EdBGf%2540JHf%2540%253F%2560AnCr%2540pCAz%2540JjAGLL%255C%2560%2540lHGj%2540WLWh%2540D%2540%255E_%2540NBDHJhJ_%257CAzd%2540ydA~%255Ck%2560%2540%257CL_h%2540%257DyDad%2540vOwp%2540fTsx%2540dYek%2540dRWAc%2540cD%257BE~AeAcI%257DSpH~%2540tHuKrDd%2540rAoKtI%257DEfE_C%257CB%257BHpGeDzCACaIbH%257BK~I%255Bb%2540%257DI%2560IpBhGs_%2540n%255D%257DRol%2540%257DMya%2540bHeG%257B%255DmhAgEwNgCyLa%2540%255EaTkr%2540iM_d%2540kAaFiBwG%257BBkGhGgGtEsDb%2540Qpl%2540ad%2540aKw%255DSP_a%2540mvAbCmBci%2540etAoXbUgYq~%2540kP%257Di%2540%257CQsBuUg_BxD_BkLev%2540%257C%2540i%2540fDkCjBcB%2560CcBrDsBxDyAhBe%2540%257CXoDqNeaAyc%2540g~C&title=Moncton%20%7C%20New%20Brunswick,%20Canada";

export default function Home() {
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeMenu = () => setIsMenuOpen(false);
    return (
        <div className="home-page">
            {/* Header/Nav */}
            <header className="home-header">
                <div className="container header-container">
                    <div className="logo-container">
                        <img src={logoImg} alt="EXIT Realty Logo" className="header-logo" />
                        <span className="logo-text">Raphael Lemire</span>
                    </div>
                    <nav className="desktop-nav">
                        <a href={BROWSE_LISTINGS_URL} className="btn-outline" target="_blank" rel="noopener noreferrer">Find a Home</a>
                    </nav>
                    <button 
                        className={`hamburger ${isMenuOpen ? 'is-active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <span className="hamburger-label">MENU</span>
                        <div className="hamburger-box">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? 'is-open' : ''}`} onClick={closeMenu}>
                <button className="mobile-menu-close" onClick={closeMenu} aria-label="Close Menu">
                    &times;
                </button>
                <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
                    <a href="#browse" onClick={closeMenu}>Find a Home</a>
                    <a href="#approach" onClick={closeMenu}>Strategy</a>
                    <a href="#about" onClick={closeMenu}>About Me</a>
                    <a href="#faq" onClick={closeMenu}>FAQ</a>
                    <a href="#contact" onClick={closeMenu}>Contact</a>
                    <Link to="/survey" className="btn-primary" onClick={closeMenu}>Book a Consultation</Link>
                </nav>
            </div>

            {/* Hero Section */}
            <section id="hero" className="hero">
                <div className="container hero-content hero-split">
                    <div className="hero-text-side">
                        <div className="hero-tag slide-up">Greater Moncton Real Estate</div>
                        <h1 className="hero-title slide-up">
                            Your dedicated partner in <br /> Real Estate.
                        </h1>
                        <p className="hero-subtitle slide-up fade-in" style={{ animationDelay: '0.2s' }}>
                            Whether you're buying, selling, or investing, experience a seamless process tailored to your goals in Greater Moncton, Dieppe, Riverview, Shediac, and surrounding areas.
                        </p>
                        <div className="hero-actions slide-up fade-in" style={{ animationDelay: '0.4s' }}>
                            <Link to="/survey" className="btn-primary">Book a Consultation</Link>
                        </div>
                    </div>
                    <div className="hero-image-side slide-up fade-in" style={{ animationDelay: '0.6s' }}>
                        <img src={profileImg} alt="Raphael Lemire | EXIT Realty" className="profile-img glass-panel" />
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="value-prop">
                <div className="container vp-container">
                    <div className="vp-grid">
                        <div className="vp-card glass-panel">
                            <div className="vp-icon">🏆</div>
                            <h3>Local Expertise</h3>
                            <p>Deep knowledge of Greater Moncton and surrounding rural areas to find properties that perfectly match your lifestyle and budget.</p>
                        </div>
                        <div className="vp-card glass-panel">
                            <div className="vp-icon">🤝</div>
                            <h3>Dedicated Partner</h3>
                            <p>I prioritize your goals, ensuring a transparent, stress-free process from the first showing to the final closing.</p>
                        </div>
                        <div className="vp-card glass-panel">
                            <div className="vp-icon">📈</div>
                            <h3>Proven Results</h3>
                            <p>Leveraging EXIT Realty's premier network and marketing tools to get maximum value whether you're buying or selling.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* My Approach Section */}
            <section id="approach" className="approach-section">
                <div className="container approach-container">
                    <h2 className="section-title">A tailored approach to Greater Moncton real estate.</h2>
                    <p className="section-subtitle">
                        I believe buying or selling a home shouldn't be complicated. My process is designed to remove the friction, giving you clarity and confidence every step of the way.
                    </p>

                    <div className="process-steps">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Consultation</h3>
                                <p>We start by understanding your specific needs, budget, and timeline to define a clear winning strategy.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Strategy</h3>
                                <p>Whether marketing your property or hunting for the perfect home, I customize a plan targeting the right audience or neighborhoods.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Success</h3>
                                <p>From fierce negotiation to seamlessly handling the closing details, I'm by your side until the keys are in hand.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Browse Listings Section */}
            <section id="browse" className="browse-listings-section">
                <div className="section-overlay"></div>
                <div className="container browse-container">
                    <div className="browse-grid">
                        <div className="browse-text glass-card">
                            <div className="browse-badge fade-in">Exclusive Search</div>
                            <h2 className="section-title">Find Your Dream Home</h2>
                            <p className="section-subtitle">
                                Searching for properties has never been easier. Use our interactive map to explore Greater Moncton, Dieppe, and surrounding areas. Set custom zones and swipe to save your absolute favorites.
                            </p>
                            <div className="browse-actions">
                                <a href={BROWSE_LISTINGS_URL} className="btn-primary browse-btn" target="_blank" rel="noopener noreferrer">
                                    Start Your Search
                                </a>
                            </div>
                        </div>
                        
                        <div className="app-showcase">
                            <div className="showcase-inner">
                                <div className="mockup-img map-mockup">
                                    <img src={appMapImg} alt="Map View Interface" />
                                </div>
                                <div className="mockup-img card-mockup">
                                    <img src={appCardImg} alt="Card View Interface" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Me Section */}
            <section id="about" className="about-section">
                <div className="container about-container glass-panel">
                    <div className="about-content">
                        <h2 className="section-title">Meet Raphaël Lemire</h2>
                        <div className="about-text">
                            <p>Before entering real estate, I built my professional experience in corrections at the SRCC in Shediac and in automotive sales. Those roles shaped the way I work today — with discipline, attention to detail, and a strong focus on helping people make confident decisions.</p>
                            <p>I have been working in the real estate industry since 2022, assisting buyers and sellers across Moncton, Dieppe, and the surrounding communities. My goal is to make the process clear, strategic, and stress-free from the first consultation to closing.</p>
                            <p>I am also part of the BGRS program, which allows me to assist military members, RCMP families, and other government employees relocating to the Greater Moncton area.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section">
                <div className="container faq-container">
                    <h2 className="section-title">Most Frequent Questions</h2>
                    <p className="section-subtitle">Everything you need to know about the process and the Greater Moncton market.</p>

                    <div className="faq-list">
                        <FAQItem
                            question="How does the Greater Moncton real estate market look right now?"
                            answer="The market across Greater Moncton, Dieppe, Riverview, and Shediac remains one of the most vibrant in Atlantic Canada. We're seeing steady demand with a focus on value. Whether you're looking for a family home or an investment property, there are excellent opportunities across various neighborhoods."
                            isOpen={openFaqIndex === 0}
                            onToggle={() => toggleFaq(0)}
                        />
                        <FAQItem
                            question="What should I expect during our first consultation?"
                            answer="Our first meeting is all about you. We'll discuss your goals, budget, and timeline. I'll provide an overview of the current market and we'll start drafting a strategy that aligns with your needs—no pressure, just clarity."
                            isOpen={openFaqIndex === 1}
                            onToggle={() => toggleFaq(1)}
                        />
                        <FAQItem
                            question="How do you handle negotiations for buyers?"
                            answer="I take a data-driven approach to negotiations. By analyzing recent comparable sales and understanding the seller's motivations, I ensure we present the strongest possible offer while protecting your interests and budget."
                            isOpen={openFaqIndex === 2}
                            onToggle={() => toggleFaq(2)}
                        />
                        <FAQItem
                            question="What's the process for listing my home with you?"
                            answer="Listing begins with a comprehensive market analysis and professional staging advice. We then use EXIT Realty's premier marketing network to ensure your property gets maximum exposure to qualified buyers, followed by dedicated support through to closing."
                            isOpen={openFaqIndex === 3}
                            onToggle={() => toggleFaq(3)}
                        />
                        <FAQItem
                            question="Is there a fee for the initial booking or consultation?"
                            answer="Absolutely not. The initial consultation is strictly a chance for us to meet, discuss your goals, and see if we're a good fit to work together. My goal is to provide value from the very first conversation."
                            isOpen={openFaqIndex === 4}
                            onToggle={() => toggleFaq(4)}
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section id="contact" className="final-cta">
                <div className="container final-cta-content">
                    <h2>Ready to discuss your goals?</h2>
                    <p className="cta-subtitle">Schedule a quick consultation with me, absolutely free. Or reach out to me directly anytime.</p>

                    <div className="contact-actions">
                        <Link to="/survey" className="btn-primary">Book a Consultation</Link>
                        <button 
                            onClick={() => setShowContactModal(true)} 
                            className="btn-secondary cta-call"
                        >
                            Or Text/Call Me Now
                        </button>
                    </div>

                    <div className="contact-info">
                        <button 
                            onClick={() => setShowContactModal(true)} 
                            className="contact-link contact-trigger-link"
                        >
                            📞 Call / Text: (506) 227-5702
                        </button>
                        <span className="contact-divider">|</span>
                        <a href="mailto:raphael@exitmoncton.ca" className="contact-link">✉️ raphael@exitmoncton.ca</a>
                    </div>
                </div>
            </section>

            <footer className="home-footer">
                <p>&copy; {new Date().getFullYear()} Raphaël Lemire | EXIT Realty Associates | Moncton, NB</p>
            </footer>

            {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}

            {/* Scroll to Top Arrow */}
            <button 
                className={`scroll-to-top ${showScrollTop ? 'is-visible' : ''}`} 
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                ↑
            </button>
        </div>
    );
}

function ContactModal({ onClose }) {
    const phone = "(506) 227-5702";
    const email = "raphael@exitmoncton.ca";

    const handleSaveContact = () => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Raphaël Lemire
ORG:EXIT Realty Associates
TEL;TYPE=CELL:5062275702
EMAIL:raphael@exitmoncton.ca
URL:https://www.raphaellemire.com
END:VCARD`;
        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'RaphaelLemire.vcf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText("5062275702");
        alert("Phone number copied to clipboard!");
    };

    return (
        <div className="contact-modal-overlay" onClick={onClose}>
            <div className="contact-card slide-up" onClick={e => e.stopPropagation()}>
                <div className="card-header">
                    <img src={profileImg} alt="Raphaël Lemire" className="card-avatar" />
                    <h2>Raphaël Lemire</h2>
                    <p>EXIT Realty Associates</p>
                </div>
                
                <div className="card-actions">
                    <a href={`tel:5062275702`} className="action-item">
                        <span className="action-icon">📞</span>
                        <span className="action-label">Call</span>
                    </a>
                    <a href={`sms:5062275702`} className="action-item">
                        <span className="action-icon">💬</span>
                        <span className="action-label">Message</span>
                    </a>
                    <a href={`mailto:${email}`} className="action-item">
                        <span className="action-icon">✉️</span>
                        <span className="action-label">Email</span>
                    </a>
                </div>

                <div className="card-list">
                    <button onClick={handleSaveContact} className="list-item">
                        Save Contact
                    </button>
                    <button onClick={handleCopy} className="list-item">
                        Copy Number
                    </button>
                    <button onClick={onClose} className="list-item cancel">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer, isOpen, onToggle }) {
    return (
        <div className={`faq-item glass-panel ${isOpen ? 'is-open' : ''}`} onClick={onToggle}>
            <div className="faq-question">
                <h3>{question}</h3>
                <span className="faq-icon">{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && (
                <div className="faq-answer fade-in">
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}
