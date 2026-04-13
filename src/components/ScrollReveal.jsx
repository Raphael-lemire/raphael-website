import { useRef, useEffect, useState } from 'react';

export default function ScrollReveal({ children, animation = 'fade-in', delay = 0, className = '' }) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: "0px 0px -50px 0px"
        });
        
        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);
        
        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div 
            ref={domRef} 
            className={`scroll-reveal-container ${isVisible ? animation : ''} ${className}`}
            style={{ 
                opacity: isVisible ? undefined : 0,
                visibility: isVisible ? undefined : 'hidden',
                animationDelay: isVisible ? (delay ? `${delay}s` : undefined) : undefined
            }}
        >
            {children}
        </div>
    );
}
