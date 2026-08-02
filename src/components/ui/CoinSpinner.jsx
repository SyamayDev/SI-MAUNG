import React, { useEffect, useRef } from 'react';
import styles from './CoinSpinner.module.css';

const CoinSpinner = ({ message = "Loading..." }) => {
  const coinRef = useRef(null);
  const pathFrontRef = useRef(null);
  const textPathFrontRef = useRef(null);
  const pathBackRef = useRef(null);
  const textPathBackRef = useRef(null);
  const twentyRef = useRef(null);

  const fitTextToArc = (pathElement, textPathElement) => {
    if (!pathElement || !textPathElement) return;
    try {
      const pathLen = pathElement.getTotalLength();
      const padding = 5;
      const available = pathLen + padding;
      textPathElement.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      textPathElement.setAttribute('textLength', available.toFixed(1));
    } catch (error) {
      console.error("Error fitting text to arc:", error);
    }
  };

  const countUp = (el, target, duration) => {
    if (!el) return;
    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * target);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(update);
  };

  const createParticles = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.classList.add(styles.particle); // Use CSS module class

      const size = Math.random() * 4 + 1;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 2 + 2;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;

      container.appendChild(particle);
    }
  };

  const buildCoinEdges = (coinElement, edgeCount = 24, step = 1.2) => {
    if (!coinElement) return;

    // Clear existing edges
    coinElement.querySelectorAll(`.${styles['coin-edge']}`).forEach(edge => edge.remove());

    for (let i = 0; i < edgeCount; i++) {
      const edge = document.createElement('div');
      edge.classList.add(styles['coin-edge']);

      if (i % 3 === 0) {
        edge.style.background = 'linear-gradient(90deg, #9a9a9a 0%, #7a7a7a 30%, #5a5a5a 50%, #7a7a7a 70%, #9a9a9a 100%)';
      } else if (i % 3 === 1) {
        edge.style.background = 'linear-gradient(90deg, #8a8a8a 0%, #6a6a6a 30%, #4a4a4a 50%, #6a6a6a 70%, #8a8a8a 100%)';
      } else {
        edge.style.background = 'linear-gradient(90deg, #7a7a7a 0%, #5a5a5a 30%, #3a3a3a 50%, #5a5a5a 70%, #7a7a7a 100%)';
      }
      edge.style.boxShadow = 'inset 0 0 8px rgba(0,0,0,0.7)';
      edge.style.border = '1px solid #444';

      const offset = (i - edgeCount / 2) * step;
      edge.style.transform = `translateZ(${offset}px)`;

      // Prepend to maintain correct Z-order for 3D effect
      coinElement.prepend(edge);
    }

    const maxOffset = (edgeCount / 2) * step;
    const front = coinElement.querySelector(`.${styles['coin-front']}`);
    const back = coinElement.querySelector(`.${styles['coin-back']}`);

    if (front) front.style.transform = `rotateY(0deg) translateZ(${maxOffset}px)`;
    if (back) back.style.transform = `rotateY(180deg) translateZ(${maxOffset}px)`;
  };


  useEffect(() => {
    // Build coin edges
    buildCoinEdges(coinRef.current);

    // Fit text to arcs
    fitTextToArc(pathFrontRef.current, textPathFrontRef.current);
    fitTextToArc(pathBackRef.current, textPathBackRef.current);

    // Initial count up for "20"
    countUp(twentyRef.current, 20, 1500);

    // Create particles
    createParticles('particles-front');
    createParticles('particles-back');

    // Handle resize for text fitting
    const handleResize = () => {
      fitTextToArc(pathFrontRef.current, textPathFrontRef.current);
      fitTextToArc(pathBackRef.current, textPathBackRef.current);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={styles.coinSpinnerContainer} role="status" aria-label={message}>
      <div className={styles.scene}>
        <div className={styles.coin} id="coin" ref={coinRef}>
          {/* Coin Front */}
          <div className={`${styles['coin-face']} ${styles['coin-front']}`}>
            <div className={styles['badge-container']}>
              <div className={styles.particles} id="particles-front" aria-hidden="true"></div>
              <svg className={styles['badge-svg']} viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <path id="circle-top-front" d="M 28,190 A 162,162 0 0,1 352,190" ref={pathFrontRef} />
                  <path id="circle-bottom-front" d="M 352,190 A 138,138 0 0,1 28,190" ref={pathBackRef} /> {/* Re-using backRef for bottom path */}
                  <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--coin-gradient-start)" />
                    <stop offset="63.4%" stopColor="var(--coin-gradient-start)" />
                    <stop offset="63.4%" stopColor="var(--coin-gradient-end)" />
                    <stop offset="100%" stopColor="var(--coin-gradient-end)" />
                  </linearGradient>
                </defs>

                <circle cx="190" cy="190" r="195" fill="var(--coin-fill-color)" stroke="var(--coin-border-color)" strokeWidth="35"></circle>
                <circle cx="190" cy="190" r="204" fill="url(#badgeGradient)" stroke="white" strokeWidth="10"></circle>

                <svg id="arrowDividerLeftFront" width="100" height="300" xmlns="http://www.w3.org/2000/svg">
                  <g transform="rotate(-18, 42, 262)">
                    <path d="M -11 229 L 42 271 L 93 252 Z" fill="#173A7A" stroke="#173A7A"/>
                    <path d="M -2 232 L 43 271 L 83 252" fill="none" stroke="white" strokeWidth="9" strokeLinejoin="miter" strokeLinecap="butt"/>
                    <line x1="1" y1="252" x2="83" y2="252" stroke="none" strokeWidth="9" strokeLinecap="butt"/>
                  </g>
                </svg>

                <svg id="arrowDividerRightFront" width="380" height="380" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(380,0) scale(-1,1) rotate(-18, 42, 262)">
                    <path d="M -11 229 L 42 271 L 93 252 Z" fill="#173A7A" stroke="#173A7A"/>
                    <path d="M -2 232 L 43 271 L 83 252" fill="none" stroke="white" strokeWidth="9" strokeLinejoin="miter" strokeLinecap="butt"/>
                    <line x1="1" y1="252" x2="83" y2="252" stroke="none" strokeWidth="9" strokeLinecap="butt"/>
                  </g>
                </svg>

                <text id="topTextFrontSVG" className={styles['curved-text-top']} dy="17">
                  <textPath id="topTextPathFront" href="#circle-top-front" startOffset="50%" ref={textPathFrontRef}>
                    20 YEARS SYLHET & SURROUNDING AREAS
                  </textPath>
                </text>

                <text className={styles['curved-stars-bottom']} dy="4">
                  <textPath href="#circle-bottom-front" startOffset="50%">
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                  </textPath>
                </text>
              </svg>

              <div className={styles['inner-content-wrapper']}>
                <div className={styles['inner-content']}>
                  <div className={styles['twenty']} ref={twentyRef} aria-live="polite" aria-label="20 years">20</div>
                  <div className={styles.years}>YEARS</div>
                  <div className={styles.location}>
                    <span>SYLHET &<br /></span>
                    <span>SURROUNDING<br /></span>
                    <span>AREAS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coin Back */}
          <div className={`${styles['coin-face']} ${styles['coin-back']}`}>
            <div className={styles['badge-container']}>
              <div className={styles.particles} id="particles-back" aria-hidden="true"></div>
              <svg className={styles['badge-svg']} viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <path id="circle-top-back" d="M 28,190 A 162,162 0 0,1 352,190" />
                  <path id="circle-bottom-back" d="M 352,190 A 138,138 0 0,1 28,190" />
                  <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--coin-gradient-start)" />
                    <stop offset="63.4%" stopColor="var(--coin-gradient-start)" />
                    <stop offset="63.4%" stopColor="var(--coin-gradient-end)" />
                    <stop offset="100%" stopColor="var(--coin-gradient-end)" />
                  </linearGradient>
                </defs>

                <circle cx="190" cy="190" r="190" fill="var(--coin-fill-color)" stroke="var(--coin-border-color)" strokeWidth="3"></circle>
                <circle cx="190" cy="190" r="204" fill="url(#badgeGradient)" stroke="white" strokeWidth="10"></circle>

                <svg id="arrowDividerLeftBack" width="100" height="300" xmlns="http://www.w3.org/2000/svg">
                  <g transform="rotate(-18, 42, 262)">
                    <path d="M -11 229 L 42 271 L 93 252 Z" fill="#173A7A" stroke="#173A7A"/>
                    <path d="M -2 232 L 43 271 L 83 252" fill="none" stroke="white" strokeWidth="9" strokeLinejoin="miter" strokeLinecap="butt"/>
                    <line x1="1" y1="252" x2="83" y2="252" stroke="none" strokeWidth="9" strokeLinecap="butt"/>
                  </g>
                </svg>

                <svg id="arrowDividerRightBack" width="380" height="380" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(380,0) scale(-1,1) rotate(-18, 42, 262)">
                    <path d="M -11 229 L 42 271 L 93 252 Z" fill="#173A7A" stroke="#173A7A"/>
                    <path d="M -2 232 L 43 271 L 83 252" fill="none" stroke="white" strokeWidth="9" strokeLinejoin="miter" strokeLinecap="butt"/>
                    <line x1="1" y1="252" x2="83" y2="252" stroke="none" strokeWidth="9" strokeLinecap="butt"/>
                  </g>
                </svg>
                <text id="topTextBackSVG" className={styles['curved-text-top']} dy="17">
                  <textPath id="topTextPathBack" href="#circle-top-back" startOffset="50%" ref={textPathBackRef}>
                    20 YEARS SYLHET & SURROUNDING CITIES
                  </textPath>
                </text>
                <text className={styles['curved-stars-bottom']} dy="7">
                  <textPath href="#circle-bottom-back" startOffset="50%">
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                    <tspan className={styles.star}>★</tspan>
                  </textPath>
                </text>
              </svg>
              <div className={styles['inner-content-wrapper']}>
                <div className={styles['inner-content']}>
                  <div className={styles['twenty']} aria-live="polite" aria-label="20 years">20</div>
                  <div className={styles.years}>YEARS</div>
                  <div className={styles.location}>
                    <span>SYLHET &<br /></span>
                    <span>SURROUNDING<br /></span>
                    <span>CITIES</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{message}</p>
    </div>
  );
};

export default CoinSpinner;