import React from 'react';
import { useTranslation } from 'react-i18next';
import './LegalPage.css';

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';

  const content = {
    en: {
      title: 'Privacy Policy',
      updated: 'Last updated: February 2026',
      sections: [
        { h: 'Who We Are', p: 'Gormaran AI Growth Hub ("Gormaran", "we", "our", or "us") is a SaaS platform providing AI-powered tools for marketing, content creation, strategy, and business growth, accessible at gormaran.io. The data controller is Gormaran, operated by Gabriela Ormazábal.' },
        { h: 'Information We Collect', p: 'We collect: (1) Account data — name, email address, and password when you register. (2) Usage data — tools used, queries submitted, and frequency of use. (3) Payment data — processed securely by Stripe; we do not store card details. (4) Technical data — IP address, browser type, device information, and cookies.' },
        { h: 'How We Use Your Data', p: 'We use your data to: provide and improve our services; process payments and manage your subscription; send transactional emails (account confirmation, billing); personalise your experience; comply with legal obligations. We do not sell your personal data to third parties.' },
        { h: 'Third-Party Services', p: 'We use: Firebase (Google) for authentication and database; Stripe for payment processing; Anthropic for AI generation; Google Analytics for anonymised usage statistics; Render for hosting. Each provider operates under its own privacy policy.' },
        { h: 'Data Retention', p: 'We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or tax purposes.' },
        { h: 'Your Rights (GDPR)', p: 'If you are in the EU/EEA, you have the right to access, rectify, erase, restrict, or port your personal data. You may also object to processing or withdraw consent at any time. To exercise these rights, contact us at privacy@gormaran.io.' },
        { h: 'Cookies', p: 'We use essential cookies for authentication, preference cookies to remember your language and settings, and analytics cookies (Google Analytics). You can manage cookies through your browser settings. See our Cookie Policy for full details.' },
        { h: 'Security', p: 'We implement industry-standard security measures including HTTPS encryption, secure authentication via Firebase, and regular security reviews. However, no transmission over the internet is 100% secure.' },
        { h: 'Changes to This Policy', p: 'We may update this policy from time to time. We will notify you of significant changes by email or via a notice on our platform. The "last updated" date at the top of this page reflects the most recent revision.' },
        { h: 'Contact', p: 'For any privacy-related queries, contact us at privacy@gormaran.io or via LinkedIn at linkedin.com/in/gabrielaormazabal.' },
      ],
    },
    es: {
      title: 'Política de Privacidad',
      updated: 'Última actualización: febrero 2026',
      sections: [
        { h: 'Quiénes Somos', p: 'Gormaran AI Growth Hub ("Gormaran", "nosotros") es una plataforma SaaS que ofrece herramientas de IA para marketing, creación de contenido, estrategia y crecimiento empresarial, accesible en gormaran.io. El responsable del tratamiento de datos es Gormaran, operado por Gabriela Ormazábal.' },
        { h: 'Información que Recopilamos', p: 'Recopilamos: (1) Datos de cuenta — nombre, correo electrónico y contraseña al registrarte. (2) Datos de uso — herramientas utilizadas, consultas enviadas y frecuencia de uso. (3) Datos de pago — procesados de forma segura por Stripe; no almacenamos datos de tarjeta. (4) Datos técnicos — dirección IP, tipo de navegador, información del dispositivo y cookies.' },
        { h: 'Cómo Usamos tus Datos', p: 'Usamos tus datos para: proporcionar y mejorar nuestros servicios; procesar pagos y gestionar tu suscripción; enviar correos transaccionales; personalizar tu experiencia; cumplir con obligaciones legales. No vendemos tus datos personales a terceros.' },
        { h: 'Servicios de Terceros', p: 'Utilizamos: Firebase (Google) para autenticación y base de datos; Stripe para pagos; Anthropic para generación de IA; Google Analytics para estadísticas anonimizadas; Render para hosting.' },
        { h: 'Retención de Datos', p: 'Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, borraremos tus datos personales en 30 días, salvo que debamos conservarlos por obligaciones legales o fiscales.' },
        { h: 'Tus Derechos (RGPD)', p: 'Si estás en la UE/EEE, tienes derecho a acceder, rectificar, suprimir, limitar o portar tus datos personales, así como a oponerte al tratamiento o retirar tu consentimiento. Contacta con nosotros en privacy@gormaran.io.' },
        { h: 'Cookies', p: 'Usamos cookies esenciales para autenticación, cookies de preferencias para recordar tu idioma y configuración, y cookies de analítica (Google Analytics). Consulta nuestra Política de Cookies para más detalles.' },
        { h: 'Seguridad', p: 'Aplicamos medidas de seguridad estándar del sector: cifrado HTTPS, autenticación segura mediante Firebase y revisiones periódicas de seguridad.' },
        { h: 'Cambios en esta Política', p: 'Podemos actualizar esta política periódicamente. Te notificaremos cambios significativos por correo o mediante un aviso en la plataforma.' },
        { h: 'Contacto', p: 'Para consultas relacionadas con privacidad, escríbenos a privacy@gormaran.io o a través de LinkedIn en linkedin.com/in/gabrielaormazabal.' },
      ],
    },
    fr: {
      title: 'Politique de Confidentialité',
      updated: 'Dernière mise à jour : février 2026',
      sections: [
        { h: 'Qui Sommes-Nous', p: "Gormaran AI Growth Hub (« Gormaran ») est une plateforme SaaS d'outils IA pour le marketing, la création de contenu, la stratégie et la croissance des entreprises, accessible sur gormaran.io. Le responsable du traitement est Gormaran, exploité par Gabriela Ormazábal." },
        { h: 'Données Collectées', p: 'Nous collectons : (1) Données de compte — nom, e-mail et mot de passe à l'inscription. (2) Données d'utilisation — outils utilisés et fréquence. (3) Données de paiement — traitées par Stripe ; nous ne stockons pas les données de carte. (4) Données techniques — adresse IP, type de navigateur et cookies.' },
        { h: 'Utilisation des Données', p: 'Nous utilisons vos données pour fournir et améliorer nos services, traiter les paiements, envoyer des e-mails transactionnels et personnaliser votre expérience. Nous ne vendons pas vos données personnelles.' },
        { h: 'Services Tiers', p: 'Nous utilisons Firebase, Stripe, Anthropic, Google Analytics et Render. Chaque fournisseur opère selon sa propre politique de confidentialité.' },
        { h: 'Conservation des Données', p: 'Vos données sont conservées tant que votre compte est actif. En cas de suppression, nous effaçons vos données dans un délai de 30 jours.' },
        { h: 'Vos Droits (RGPD)', p: 'Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Contactez-nous à privacy@gormaran.io.' },
        { h: 'Cookies', p: 'Nous utilisons des cookies essentiels, de préférence et d'analyse. Consultez notre Politique de Cookies pour plus de détails.' },
        { h: 'Sécurité', p: 'Nous appliquons le chiffrement HTTPS, une authentification sécurisée via Firebase et des révisions régulières.' },
        { h: 'Modifications', p: 'Nous pouvons mettre à jour cette politique. Les modifications importantes seront notifiées par e-mail ou sur la plateforme.' },
        { h: 'Contact', p: 'Pour toute question relative à la confidentialité : privacy@gormaran.io.' },
      ],
    },
    de: {
      title: 'Datenschutzrichtlinie',
      updated: 'Zuletzt aktualisiert: Februar 2026',
      sections: [
        { h: 'Wer Wir Sind', p: 'Gormaran AI Growth Hub („Gormaran") ist eine SaaS-Plattform mit KI-gestützten Tools für Marketing, Content-Erstellung, Strategie und Unternehmenswachstum, erreichbar unter gormaran.io. Verantwortliche ist Gabriela Ormazábal.' },
        { h: 'Erhobene Daten', p: 'Wir erheben: (1) Kontodaten — Name, E-Mail und Passwort bei der Registrierung. (2) Nutzungsdaten — verwendete Tools und Häufigkeit. (3) Zahlungsdaten — verarbeitet von Stripe; wir speichern keine Kartendaten. (4) Technische Daten — IP-Adresse, Browsertyp und Cookies.' },
        { h: 'Verwendung der Daten', p: 'Wir verwenden Ihre Daten zur Bereitstellung und Verbesserung unserer Dienste, Zahlungsabwicklung und Personalisierung. Wir verkaufen keine personenbezogenen Daten.' },
        { h: 'Drittanbieter', p: 'Wir nutzen Firebase, Stripe, Anthropic, Google Analytics und Render. Jeder Anbieter unterliegt seiner eigenen Datenschutzrichtlinie.' },
        { h: 'Datenspeicherung', p: 'Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Bei Löschung entfernen wir Ihre Daten innerhalb von 30 Tagen.' },
        { h: 'Ihre Rechte (DSGVO)', p: 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Kontakt: privacy@gormaran.io.' },
        { h: 'Cookies', p: 'Wir verwenden essentielle, Präferenz- und Analyse-Cookies. Weitere Details finden Sie in unserer Cookie-Richtlinie.' },
        { h: 'Sicherheit', p: 'Wir setzen HTTPS-Verschlüsselung, sichere Authentifizierung und regelmäßige Sicherheitsprüfungen ein.' },
        { h: 'Änderungen', p: 'Wir können diese Richtlinie aktualisieren. Wesentliche Änderungen werden per E-Mail oder auf der Plattform mitgeteilt.' },
        { h: 'Kontakt', p: 'Bei Datenschutzfragen: privacy@gormaran.io.' },
      ],
    },
    it: {
      title: 'Informativa sulla Privacy',
      updated: 'Ultimo aggiornamento: febbraio 2026',
      sections: [
        { h: 'Chi Siamo', p: 'Gormaran AI Growth Hub ("Gormaran") è una piattaforma SaaS con strumenti AI per marketing, creazione di contenuti, strategia e crescita aziendale, accessibile su gormaran.io. Il titolare del trattamento è Gormaran, gestito da Gabriela Ormazábal.' },
        { h: 'Dati Raccolti', p: 'Raccogliamo: (1) Dati account — nome, e-mail e password alla registrazione. (2) Dati di utilizzo — strumenti utilizzati e frequenza. (3) Dati di pagamento — elaborati da Stripe; non memorizziamo dati di carta. (4) Dati tecnici — indirizzo IP, tipo di browser e cookie.' },
        { h: 'Utilizzo dei Dati', p: 'Utilizziamo i tuoi dati per fornire e migliorare i servizi, elaborare i pagamenti e personalizzare la tua esperienza. Non vendiamo dati personali a terzi.' },
        { h: 'Servizi di Terze Parti', p: 'Utilizziamo Firebase, Stripe, Anthropic, Google Analytics e Render. Ogni fornitore opera secondo la propria informativa.' },
        { h: 'Conservazione dei Dati', p: 'Conserviamo i tuoi dati finché il tuo account è attivo. In caso di cancellazione, rimuoviamo i dati entro 30 giorni.' },
        { h: 'I Tuoi Diritti (GDPR)', p: 'Hai diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione. Contattaci a privacy@gormaran.io.' },
        { h: 'Cookie', p: 'Utilizziamo cookie essenziali, di preferenza e analitici. Consulta la nostra Cookie Policy per i dettagli.' },
        { h: 'Sicurezza', p: 'Applichiamo crittografia HTTPS, autenticazione sicura tramite Firebase e revisioni periodiche della sicurezza.' },
        { h: 'Modifiche', p: 'Possiamo aggiornare questa informativa. Le modifiche significative saranno comunicate via e-mail o sulla piattaforma.' },
        { h: 'Contatto', p: 'Per domande sulla privacy: privacy@gormaran.io.' },
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
