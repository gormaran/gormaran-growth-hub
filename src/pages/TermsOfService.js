import React from 'react';
import { useTranslation } from 'react-i18next';
import './LegalPage.css';

export default function TermsOfService() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';

  const content = {
    en: {
      title: 'Terms of Service',
      updated: 'Last updated: February 2026',
      sections: [
        { h: 'Acceptance of Terms', p: 'By accessing or using Gormaran AI Growth Hub ("Gormaran", "the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.' },
        { h: 'Description of Service', p: 'Gormaran provides AI-powered tools for marketing, content creation, business strategy, e-commerce, agency management, startup planning, creative direction, financial planning, and workflow automation. Access is provided via subscription plans (Free, Grow, Scale, Evolution) and optional add-ons.' },
        { h: 'Account Registration', p: 'You must register for an account to access most features. You agree to provide accurate, current, and complete information and to keep your credentials confidential. You are responsible for all activity under your account. You must be at least 18 years old to use the Service.' },
        { h: 'Subscriptions and Payments', p: 'Paid subscriptions are billed monthly or annually via Stripe. Prices are listed on the pricing page and may change with 30 days notice. Subscriptions auto-renew unless cancelled before the renewal date. No refunds are issued for partial billing periods, except where required by applicable law.' },
        { h: 'Free Trial', p: 'New users receive a 14-day free trial with full access. After the trial, the account is downgraded to the Free plan unless a paid plan is selected. No credit card is required for the trial.' },
        { h: 'Acceptable Use', p: 'You agree not to: use the Service for any unlawful purpose; generate content that is harmful, defamatory, or infringes third-party rights; attempt to reverse-engineer, copy, or resell the Service; abuse or overload our systems; share your account credentials with others.' },
        { h: 'Intellectual Property', p: 'The Gormaran platform, its design, code, and AI prompts are the intellectual property of Gormaran. Content you generate using the Service is yours to use for lawful purposes. You grant Gormaran a limited licence to process your inputs for the purpose of delivering the Service.' },
        { h: 'AI-Generated Content', p: 'Gormaran uses large language models to generate content. Outputs are AI-generated and may not always be accurate, complete, or suitable for all purposes. You are responsible for reviewing, editing, and verifying all AI outputs before use.' },
        { h: 'Limitation of Liability', p: 'To the maximum extent permitted by law, Gormaran is not liable for indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability is limited to the amount paid by you in the 3 months preceding the claim.' },
        { h: 'Termination', p: 'We may suspend or terminate your account if you violate these Terms. You may cancel your subscription at any time via the Settings page. Upon termination, your access to paid features will cease at the end of the billing period.' },
        { h: 'Governing Law', p: 'These Terms are governed by the laws of Spain. Any disputes shall be resolved in the competent courts of Spain, unless mandatory consumer protection laws in your country provide otherwise.' },
        { h: 'Contact', p: 'For questions about these Terms, contact us at hello@gormaran.io.' },
      ],
    },
    es: {
      title: 'Términos de Servicio',
      updated: 'Última actualización: febrero 2026',
      sections: [
        { h: 'Aceptación de los Términos', p: 'Al acceder o utilizar Gormaran AI Growth Hub ("Gormaran", "el Servicio"), aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo, no utilices el Servicio.' },
        { h: 'Descripción del Servicio', p: 'Gormaran ofrece herramientas de IA para marketing, creación de contenido, estrategia empresarial, e-commerce, gestión de agencias, startups, dirección creativa, finanzas y automatización. El acceso se proporciona mediante planes de suscripción (Free, Grow, Scale, Evolution) y complementos opcionales.' },
        { h: 'Registro de Cuenta', p: 'Debes registrarte para acceder a la mayoría de las funciones. Te comprometes a proporcionar información veraz y a mantener la confidencialidad de tus credenciales. Debes tener al menos 18 años para usar el Servicio.' },
        { h: 'Suscripciones y Pagos', p: 'Las suscripciones de pago se facturan mensual o anualmente a través de Stripe. Los precios pueden cambiar con 30 días de aviso. Las suscripciones se renuevan automáticamente salvo cancelación previa. No se emiten reembolsos por períodos parciales, salvo lo exigido por ley.' },
        { h: 'Período de Prueba', p: 'Los nuevos usuarios reciben 14 días de prueba con acceso completo. Tras el período de prueba, la cuenta pasa al plan Free salvo que se seleccione un plan de pago. No se requiere tarjeta de crédito.' },
        { h: 'Uso Aceptable', p: 'No debes: usar el Servicio para fines ilegales; generar contenido dañino o que infrinja derechos de terceros; intentar hacer ingeniería inversa o revender el Servicio; compartir credenciales de cuenta.' },
        { h: 'Propiedad Intelectual', p: 'La plataforma Gormaran, su diseño, código y prompts de IA son propiedad intelectual de Gormaran. El contenido que generes es tuyo. Concedes a Gormaran una licencia limitada para procesar tus entradas con el fin de prestar el Servicio.' },
        { h: 'Contenido Generado por IA', p: 'Gormaran utiliza modelos de lenguaje para generar contenido. Los resultados son generados por IA y pueden no ser siempre precisos. Eres responsable de revisar y verificar todos los resultados antes de usarlos.' },
        { h: 'Limitación de Responsabilidad', p: 'En la máxima medida permitida por la ley, Gormaran no es responsable de daños indirectos o consecuentes. Nuestra responsabilidad total se limita al importe pagado en los 3 meses anteriores a la reclamación.' },
        { h: 'Resolución', p: 'Podemos suspender tu cuenta si incumples estos Términos. Puedes cancelar tu suscripción en cualquier momento desde la página de Ajustes.' },
        { h: 'Ley Aplicable', p: 'Estos Términos se rigen por la legislación española. Las disputas se resolverán en los tribunales competentes de España.' },
        { h: 'Contacto', p: 'Para preguntas sobre estos Términos, escríbenos a hello@gormaran.io.' },
      ],
    },
    fr: {
      title: 'Conditions d\'Utilisation',
      updated: 'Dernière mise à jour : février 2026',
      sections: [
        { h: 'Acceptation des Conditions', p: 'En utilisant Gormaran AI Growth Hub, vous acceptez ces Conditions d\'Utilisation.' },
        { h: 'Description du Service', p: 'Gormaran propose des outils IA pour le marketing, la création de contenu, la stratégie, l\'e-commerce, la gestion d\'agences, les startups, le studio créatif, la finance et l\'automatisation, via des plans d\'abonnement (Free, Grow, Scale, Evolution).' },
        { h: 'Inscription', p: 'Vous devez avoir 18 ans minimum et fournir des informations exactes. Vous êtes responsable de toute activité sous votre compte.' },
        { h: 'Abonnements et Paiements', p: 'Les abonnements payants sont facturés mensuellement ou annuellement via Stripe. Les prix peuvent évoluer avec 30 jours de préavis. Les abonnements se renouvellent automatiquement sauf résiliation.' },
        { h: 'Essai Gratuit', p: '14 jours d\'essai gratuit avec accès complet. Aucune carte bancaire requise.' },
        { h: 'Utilisation Acceptable', p: 'Il est interdit d\'utiliser le Service à des fins illégales, de générer du contenu nuisible ou de partager vos identifiants.' },
        { h: 'Propriété Intellectuelle', p: 'La plateforme Gormaran est notre propriété intellectuelle. Le contenu que vous générez vous appartient.' },
        { h: 'Contenu IA', p: 'Les résultats générés par IA peuvent ne pas être toujours exacts. Vous êtes responsable de leur vérification.' },
        { h: 'Limitation de Responsabilité', p: 'Notre responsabilité est limitée au montant payé dans les 3 mois précédant la réclamation.' },
        { h: 'Résiliation', p: 'Vous pouvez résilier à tout moment depuis les Paramètres.' },
        { h: 'Droit Applicable', p: 'Ces Conditions sont régies par le droit espagnol.' },
        { h: 'Contact', p: 'Pour toute question : hello@gormaran.io.' },
      ],
    },
    de: {
      title: 'Nutzungsbedingungen',
      updated: 'Zuletzt aktualisiert: Februar 2026',
      sections: [
        { h: 'Annahme der Bedingungen', p: 'Durch die Nutzung von Gormaran AI Growth Hub stimmen Sie diesen Nutzungsbedingungen zu.' },
        { h: 'Leistungsbeschreibung', p: 'Gormaran bietet KI-gestützte Tools für Marketing, Content, Strategie, E-Commerce, Agenturen, Startups, Kreativstudio, Finanzen und Automatisierung über Abonnementpläne (Free, Grow, Scale, Evolution).' },
        { h: 'Registrierung', p: 'Sie müssen mindestens 18 Jahre alt sein und genaue Angaben machen. Sie sind für alle Aktivitäten unter Ihrem Konto verantwortlich.' },
        { h: 'Abonnements und Zahlungen', p: 'Bezahlte Abonnements werden monatlich oder jährlich über Stripe abgerechnet. Preise können sich mit 30 Tagen Vorankündigung ändern. Abonnements verlängern sich automatisch.' },
        { h: 'Kostenlose Testphase', p: '14 Tage kostenlose Testphase mit vollem Zugriff. Keine Kreditkarte erforderlich.' },
        { h: 'Zulässige Nutzung', p: 'Sie dürfen den Dienst nicht für illegale Zwecke nutzen oder schädliche Inhalte generieren.' },
        { h: 'Geistiges Eigentum', p: 'Die Gormaran-Plattform ist unser geistiges Eigentum. Von Ihnen erstellte Inhalte gehören Ihnen.' },
        { h: 'KI-generierte Inhalte', p: 'KI-Ausgaben können ungenau sein. Sie sind für die Überprüfung verantwortlich.' },
        { h: 'Haftungsbeschränkung', p: 'Unsere Haftung ist auf den in den letzten 3 Monaten gezahlten Betrag beschränkt.' },
        { h: 'Kündigung', p: 'Sie können Ihr Abonnement jederzeit über die Einstellungen kündigen.' },
        { h: 'Anwendbares Recht', p: 'Es gilt spanisches Recht.' },
        { h: 'Kontakt', p: 'Fragen: hello@gormaran.io.' },
      ],
    },
    it: {
      title: 'Termini di Servizio',
      updated: 'Ultimo aggiornamento: febbraio 2026',
      sections: [
        { h: 'Accettazione dei Termini', p: 'Utilizzando Gormaran AI Growth Hub, accetti questi Termini di Servizio.' },
        { h: 'Descrizione del Servizio', p: 'Gormaran offre strumenti AI per marketing, contenuti, strategia, e-commerce, agenzie, startup, studio creativo, finanza e automazione tramite piani di abbonamento (Free, Grow, Scale, Evolution).' },
        { h: 'Registrazione', p: 'Devi avere almeno 18 anni e fornire informazioni accurate. Sei responsabile di tutte le attività sul tuo account.' },
        { h: 'Abbonamenti e Pagamenti', p: 'Gli abbonamenti a pagamento vengono fatturati mensilmente o annualmente tramite Stripe. I prezzi possono variare con 30 giorni di preavviso. Gli abbonamenti si rinnovano automaticamente.' },
        { h: 'Periodo di Prova', p: '14 giorni di prova gratuita con accesso completo. Nessuna carta di credito richiesta.' },
        { h: 'Uso Consentito', p: 'Non puoi utilizzare il Servizio per scopi illegali o generare contenuti dannosi.' },
        { h: 'Proprietà Intellettuale', p: 'La piattaforma Gormaran è nostra proprietà intellettuale. I contenuti che generi sono tuoi.' },
        { h: 'Contenuto Generato da IA', p: 'I risultati dell\'IA possono non essere sempre accurati. Sei responsabile della loro verifica.' },
        { h: 'Limitazione di Responsabilità', p: 'La nostra responsabilità è limitata all\'importo pagato nei 3 mesi precedenti alla richiesta.' },
        { h: 'Risoluzione', p: 'Puoi annullare l\'abbonamento in qualsiasi momento dalle Impostazioni.' },
        { h: 'Legge Applicabile', p: 'Questi Termini sono regolati dalla legge spagnola.' },
        { h: 'Contatto', p: 'Domande: hello@gormaran.io.' },
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
