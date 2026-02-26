import React from 'react';
import { useTranslation } from 'react-i18next';
import './LegalPage.css';

export default function CookiePolicy() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';

  const content = {
    en: {
      title: 'Cookie Policy',
      updated: 'Last updated: February 2026',
      sections: [
        { h: 'What Are Cookies', p: 'Cookies are small text files stored on your device when you visit a website. They help websites function properly, remember your preferences, and gather usage analytics.' },
        { h: 'Cookies We Use', p: 'We use the following categories of cookies: (1) Essential cookies — required for the platform to function (authentication session, CSRF protection). Without these, the Service cannot operate. (2) Preference cookies — remember your language and UI settings. (3) Analytics cookies — Google Analytics 4 collects anonymised data about how users interact with our platform (pages visited, session duration, device type). No personally identifiable information is sent to Google Analytics. (4) Payment cookies — Stripe uses cookies to secure payment sessions.' },
        { h: 'Essential Cookies', p: 'These cookies cannot be disabled as they are strictly necessary for the Service to work. They include: Firebase Auth session token (secures your login); CSRF protection token (prevents cross-site request forgery).' },
        { h: 'Analytics Cookies', p: 'Google Analytics 4 (GA4) uses cookies such as _ga, _ga_*, and _gid to distinguish users and sessions. Data is anonymised and aggregated. IP addresses are anonymised. You can opt out of Google Analytics at any time via your browser settings or by installing the Google Analytics Opt-out Browser Add-on.' },
        { h: 'Managing Cookies', p: 'You can control and delete cookies through your browser settings. Please note that disabling cookies may affect the functionality of our Service. Most browsers allow you to: view cookies stored on your device; delete all or specific cookies; block cookies from specific sites; block all third-party cookies.' },
        { h: 'Third-Party Cookies', p: 'Some cookies are set by third-party services we use: Google (Analytics and Firebase Authentication), Stripe (payment processing). These providers may set their own cookies subject to their own privacy policies.' },
        { h: 'Cookie Lifespan', p: 'Essential cookies last for the duration of your session. Preference cookies persist for up to 12 months. Analytics cookies (_ga) persist for up to 2 years.' },
        { h: 'Changes to This Policy', p: 'We may update this Cookie Policy from time to time. The "last updated" date at the top of this page reflects the most recent revision.' },
        { h: 'Contact', p: 'For any questions about our use of cookies, contact us at privacy@gormaran.io.' },
      ],
    },
    es: {
      title: 'Política de Cookies',
      updated: 'Última actualización: febrero 2026',
      sections: [
        { h: 'Qué Son las Cookies', p: 'Las cookies son pequeños archivos de texto almacenados en tu dispositivo cuando visitas un sitio web. Ayudan al funcionamiento del sitio, recuerdan tus preferencias y recopilan datos de uso.' },
        { h: 'Cookies que Utilizamos', p: 'Utilizamos: (1) Cookies esenciales — necesarias para el funcionamiento (sesión de autenticación, protección CSRF). (2) Cookies de preferencias — recuerdan tu idioma y configuración de interfaz. (3) Cookies de análisis — Google Analytics 4 recopila datos anonimizados sobre el uso de la plataforma. (4) Cookies de pago — Stripe las utiliza para asegurar las sesiones de pago.' },
        { h: 'Cookies Esenciales', p: 'No pueden desactivarse ya que son imprescindibles para el funcionamiento del Servicio. Incluyen: token de sesión de Firebase Auth y token de protección CSRF.' },
        { h: 'Cookies de Análisis', p: 'Google Analytics 4 utiliza cookies como _ga, _ga_* y _gid. Los datos son anónimos y agregados. Las direcciones IP se anonimizadas. Puedes desactivar Google Analytics desde la configuración de tu navegador.' },
        { h: 'Gestión de Cookies', p: 'Puedes controlar y eliminar las cookies desde la configuración de tu navegador. La desactivación de cookies puede afectar al funcionamiento del Servicio.' },
        { h: 'Cookies de Terceros', p: 'Algunos cookies son establecidos por Google (Analytics y Firebase) y Stripe (pagos), sujetos a sus propias políticas de privacidad.' },
        { h: 'Duración de las Cookies', p: 'Cookies esenciales: duración de la sesión. Cookies de preferencias: hasta 12 meses. Cookies de análisis (_ga): hasta 2 años.' },
        { h: 'Cambios en esta Política', p: 'Podemos actualizar esta Política de Cookies. La fecha de "última actualización" refleja la revisión más reciente.' },
        { h: 'Contacto', p: 'Para preguntas sobre el uso de cookies: privacy@gormaran.io.' },
      ],
    },
    fr: {
      title: 'Politique de Cookies',
      updated: 'Dernière mise à jour : février 2026',
      sections: [
        { h: 'Que Sont les Cookies', p: 'Les cookies sont de petits fichiers texte stockés sur votre appareil lors de la visite d\'un site web.' },
        { h: 'Cookies Utilisés', p: '(1) Cookies essentiels — nécessaires au fonctionnement (session d\'authentification, protection CSRF). (2) Cookies de préférences — mémorisent votre langue et paramètres. (3) Cookies analytiques — Google Analytics 4 collecte des données anonymisées. (4) Cookies de paiement — Stripe.' },
        { h: 'Cookies Essentiels', p: 'Ces cookies ne peuvent pas être désactivés. Ils comprennent le token de session Firebase et le token CSRF.' },
        { h: 'Cookies Analytiques', p: 'Google Analytics 4 utilise _ga, _ga_* et _gid. Les données sont anonymisées. Vous pouvez vous désabonner via les paramètres de votre navigateur.' },
        { h: 'Gestion des Cookies', p: 'Vous pouvez gérer les cookies via les paramètres de votre navigateur. La désactivation peut affecter le fonctionnement du Service.' },
        { h: 'Cookies Tiers', p: 'Google (Analytics, Firebase) et Stripe peuvent déposer leurs propres cookies.' },
        { h: 'Durée de Vie', p: 'Essentiels : durée de la session. Préférences : 12 mois. Analytiques (_ga) : 2 ans.' },
        { h: 'Modifications', p: 'Nous pouvons mettre à jour cette politique à tout moment.' },
        { h: 'Contact', p: 'Questions : privacy@gormaran.io.' },
      ],
    },
    de: {
      title: 'Cookie-Richtlinie',
      updated: 'Zuletzt aktualisiert: Februar 2026',
      sections: [
        { h: 'Was Sind Cookies', p: 'Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen.' },
        { h: 'Verwendete Cookies', p: '(1) Essentielle Cookies — für den Betrieb erforderlich (Authentifizierungssitzung, CSRF-Schutz). (2) Präferenz-Cookies — speichern Ihre Sprach- und UI-Einstellungen. (3) Analyse-Cookies — Google Analytics 4 erfasst anonymisierte Nutzungsdaten. (4) Zahlungs-Cookies — Stripe.' },
        { h: 'Essentielle Cookies', p: 'Diese Cookies können nicht deaktiviert werden. Sie umfassen das Firebase-Auth-Sitzungstoken und das CSRF-Schutztoken.' },
        { h: 'Analyse-Cookies', p: 'Google Analytics 4 verwendet _ga, _ga_* und _gid. Daten werden anonymisiert. Sie können sich über Ihre Browsereinstellungen abmelden.' },
        { h: 'Cookie-Verwaltung', p: 'Sie können Cookies über Ihre Browsereinstellungen verwalten und löschen.' },
        { h: 'Drittanbieter-Cookies', p: 'Google (Analytics, Firebase) und Stripe können eigene Cookies setzen.' },
        { h: 'Cookie-Lebensdauer', p: 'Essentielle: Sitzungsdauer. Präferenz: bis 12 Monate. Analyse (_ga): bis 2 Jahre.' },
        { h: 'Änderungen', p: 'Wir können diese Richtlinie jederzeit aktualisieren.' },
        { h: 'Kontakt', p: 'Fragen: privacy@gormaran.io.' },
      ],
    },
    it: {
      title: 'Cookie Policy',
      updated: 'Ultimo aggiornamento: febbraio 2026',
      sections: [
        { h: 'Cosa Sono i Cookie', p: 'I cookie sono piccoli file di testo memorizzati sul tuo dispositivo quando visiti un sito web.' },
        { h: 'Cookie Utilizzati', p: '(1) Cookie essenziali — necessari per il funzionamento (sessione di autenticazione, protezione CSRF). (2) Cookie di preferenze — ricordano lingua e impostazioni. (3) Cookie analitici — Google Analytics 4 raccoglie dati anonimi. (4) Cookie di pagamento — Stripe.' },
        { h: 'Cookie Essenziali', p: 'Non possono essere disabilitati. Includono il token di sessione Firebase e il token CSRF.' },
        { h: 'Cookie Analitici', p: 'Google Analytics 4 usa _ga, _ga_* e _gid. I dati sono anonimi. Puoi disattivarlo dalle impostazioni del browser.' },
        { h: 'Gestione dei Cookie', p: 'Puoi gestire i cookie tramite le impostazioni del browser. La disabilitazione può influire sul funzionamento del Servizio.' },
        { h: 'Cookie di Terze Parti', p: 'Google (Analytics, Firebase) e Stripe possono impostare i propri cookie.' },
        { h: 'Durata dei Cookie', p: 'Essenziali: durata della sessione. Preferenze: fino a 12 mesi. Analitici (_ga): fino a 2 anni.' },
        { h: 'Modifiche', p: 'Possiamo aggiornare questa policy in qualsiasi momento.' },
        { h: 'Contatto', p: 'Domande: privacy@gormaran.io.' },
      ],
    },
  };

  const c = content[lang] || content.en;

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-page__header">
          <h1>{c.title}</h1>
          <p className="legal-page__updated">{c.updated}</p>
        </div>
        <div className="legal-page__body">
          {c.sections.map((s, i) => (
            <section key={i}>
              <h2>{s.h}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
