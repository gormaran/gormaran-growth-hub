import { useEffect, useRef, useState } from 'react';

const vcardData = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Gabriela Ormazabal de Aranzabal',
  'N:Ormazabal de Aranzabal;Gabriela;;;',
  'ORG:Gormaran.io',
  'TITLE:Founder & CEO',
  'TEL;TYPE=CELL:+34688679474',
  'EMAIL;TYPE=WORK:gabriela.ormazabal@gormaran-marketing.com',
  'URL:https://gormaran.io',
  'END:VCARD',
].join('\r\n');

export default function ContactoPage() {
  const qrRef = useRef(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [progress, setProgress] = useState(0);

  // Generate QR code once component mounts
  useEffect(() => {
    let script = document.querySelector('script[data-qr]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.setAttribute('data-qr', '1');
      script.onload = () => renderQR();
      document.head.appendChild(script);
    } else if (window.QRCode) {
      renderQR();
    }
  }, []);

  function renderQR() {
    if (!qrRef.current || qrRef.current.innerHTML) return;
    // eslint-disable-next-line no-new
    new window.QRCode(qrRef.current, {
      text: 'https://gormaran.io/contacto',
      width: 160,
      height: 160,
      colorDark: '#1e1b4b',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  }

  function handleSave() {
    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Gabriela_Ormazabal_Gormaran.vcf';
    a.click();
    URL.revokeObjectURL(url);

    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);

    // Countdown + redirect
    let secs = 5;
    setCountdown(secs);
    setProgress(0);
    setTimeout(() => setProgress(100), 50);

    const interval = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(interval);
        window.open('https://gormaran.io', '_blank');
      }
    }, 1000);
  }

  return (
    <>
      <style>{`
        .cpage-body {
          background: #0a0a0f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }
        .cpage-body::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 10%, rgba(124,58,237,0.35) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 90%, rgba(6,182,212,0.2) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .cpage-card {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 24px;
          padding: 40px 36px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 0 1px rgba(124,58,237,0.1), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.35);
          animation: cpFadeIn 0.6s ease both;
        }
        @keyframes cpFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cpage-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          border-radius: 16px;
          font-size: 28px;
          font-weight: 900;
          color: white;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(124,58,237,0.35);
        }
        .cpage-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.2;
          margin-bottom: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .cpage-role {
          font-size: 0.85rem;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .cpage-company {
          font-size: 1rem;
          font-weight: 600;
          background: linear-gradient(90deg, #a78bfa, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 28px;
        }
        .cpage-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent);
          margin-bottom: 24px;
        }
        .cpage-contacts {
          list-style: none;
          margin: 0 0 28px 0;
          padding: 0;
        }
        .cpage-contacts li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-align: left;
        }
        .cpage-contacts li:last-child { border-bottom: none; }
        .cpage-icon {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.2);
        }
        .cpage-label {
          font-size: 0.7rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 2px;
        }
        .cpage-value { font-size: 0.9rem; color: #f8fafc; font-weight: 500; }
        .cpage-value a { color: #f8fafc; text-decoration: none; }
        .cpage-value a:hover { color: #a78bfa; }
        .cpage-btn-save {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 12px;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 24px rgba(124,58,237,0.35);
          font-family: inherit;
        }
        .cpage-btn-save:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(124,58,237,0.5); }
        .cpage-btn-web {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          color: #f8fafc;
          font-size: 0.95rem;
          font-weight: 600;
          border: 1px solid rgba(6,182,212,0.4);
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          margin-bottom: 28px;
          transition: border-color 0.15s, background 0.15s;
          font-family: inherit;
        }
        .cpage-btn-web:hover { background: rgba(6,182,212,0.08); border-color: #06b6d4; }
        .cpage-redirect { font-size: 0.78rem; color: #94a3b8; margin-bottom: 28px; }
        .cpage-track {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }
        .cpage-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #06b6d4);
          border-radius: 2px;
          transition: width 5s linear;
        }
        .cpage-qr-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; }
        .cpage-qr-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
        .cpage-qr-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.3), 0 8px 24px rgba(0,0,0,0.3);
        }
        .cpage-toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%) translateY(60px);
          background: rgba(124,58,237,0.95);
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(167,139,250,0.3);
          z-index: 100;
          transition: transform 0.3s ease;
          white-space: nowrap;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .cpage-toast.visible { transform: translateX(-50%) translateY(0); }
      `}</style>

      <div className="cpage-body">
        <div className="cpage-card">
          <div className="cpage-logo">G</div>
          <h1 className="cpage-name">Gabriela Ormazabal<br />de Aranzabal</h1>
          <p className="cpage-role">Founder &amp; CEO</p>
          <p className="cpage-company">gormaran.io</p>

          <div className="cpage-divider" />

          <ul className="cpage-contacts">
            <li>
              <span className="cpage-icon">📱</span>
              <div>
                <span className="cpage-label">Móvil</span>
                <span className="cpage-value"><a href="tel:+34688679474">+34 688 679 474</a></span>
              </div>
            </li>
            <li>
              <span className="cpage-icon">✉️</span>
              <div>
                <span className="cpage-label">Email</span>
                <span className="cpage-value">
                  <a href="mailto:gabriela.ormazabal@gormaran-marketing.com">
                    gabriela.ormazabal@<br />gormaran-marketing.com
                  </a>
                </span>
              </div>
            </li>
            <li>
              <span className="cpage-icon">🌐</span>
              <div>
                <span className="cpage-label">Web</span>
                <span className="cpage-value"><a href="https://gormaran.io" target="_blank" rel="noopener noreferrer">gormaran.io</a></span>
              </div>
            </li>
          </ul>

          <button className="cpage-btn-save" onClick={handleSave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Guardar contacto
          </button>

          <a className="cpage-btn-web" href="https://gormaran.io" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Visitar gormaran.io
          </a>

          {countdown !== null && (
            <div className="cpage-redirect">
              Redirigiendo a gormaran.io en {countdown}s…
              <div className="cpage-track">
                <div className="cpage-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="cpage-qr-section">
            <p className="cpage-qr-label">Comparte esta tarjeta</p>
            <div className="cpage-qr-wrap">
              <div ref={qrRef} />
            </div>
          </div>
        </div>
      </div>

      <div className={`cpage-toast${toastVisible ? ' visible' : ''}`}>
        ✅ ¡Contacto listo para guardar!
      </div>
    </>
  );
}
