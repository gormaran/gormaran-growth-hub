import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { CATEGORIES } from '../data/categories';
import './LandingPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const STATS = [
  { value: '7', label: 'AI Categories', suffix: '' },
  { value: '35', label: 'Specialized Tools', suffix: '+' },
  { value: '99', label: 'Precision Rate', suffix: '%' },
  { value: '10x', label: 'Faster Workflows', suffix: '' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'Category-Precise AI',
    description: 'Each tool has a custom-engineered AI prompt designed by industry experts, delivering laser-focused output for your exact use case.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Streaming',
    description: 'See your content generate word-by-word with Claude AI. No waiting — start reading and editing immediately.',
  },
  {
    icon: '🎯',
    title: '35+ Specialized Tools',
    description: 'From SEO keyword research to investor pitch decks — every tool is purpose-built, not a generic AI wrapper.',
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    description: 'Firebase authentication, encrypted API calls, and your API keys never touch the browser.',
  },
  {
    icon: '📊',
    title: 'Structured Outputs',
    description: 'Every output is formatted with headers, tables, and bullet points — ready to copy and use immediately.',
  },
  {
    icon: '🚀',
    title: 'Built for Speed',
    description: 'From idea to finished content in under 2 minutes. Stop spending days on tasks that take minutes.',
  },
];

const TESTIMONIALS = [
  {
    text: 'Gormaran cut our content production time by 70%. The category-specific prompts are unreal — it actually understands what we need.',
    name: 'Sarah K.',
    title: 'Head of Marketing, TechFlow',
    avatar: 'S',
  },
  {
    text: 'As a startup founder, I used the Investor Pitch tool to refine my deck. The Q&A prep section alone was worth 10x the subscription.',
    name: 'Marcus T.',
    title: 'Founder, LaunchPad AI',
    avatar: 'M',
  },
  {
    text: 'My agency uses the Proposal Generator and Client Report tools every week. Our clients love the professionalism of the output.',
    name: 'Olivia R.',
    title: 'CEO, Pixel Growth Agency',
    avatar: 'O',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing__hero">
        {/* Background elements */}
        <div className="landing__hero-bg">
          <div className="landing__orb landing__orb-1" />
          <div className="landing__orb landing__orb-2" />
          <div className="landing__orb landing__orb-3" />
          <div className="landing__grid-pattern" />
        </div>

        <div className="container">
          <motion.div
            className="landing__hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span className="landing__hero-badge">
                ⚡ Powered by Claude AI
              </span>
            </motion.div>

            <motion.h1 className="landing__hero-title" variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
              The AI Growth Hub
              <br />
              <span className="gradient-text">Built for Results</span>
            </motion.h1>

            <motion.p className="landing__hero-subtitle" variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
              7 AI-powered categories. 35+ precision-engineered tools. One platform to grow your business faster — from SEO and Google Ads to investor pitches and Amazon listings.
            </motion.p>

            <motion.div className="landing__hero-actions" variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
              <Link to="/auth?mode=register" className="btn btn-primary btn-lg landing__cta-btn">
                Start Free — No Credit Card
                <span className="landing__cta-arrow">→</span>
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">
                View Pricing
              </Link>
            </motion.div>

            <motion.div className="landing__hero-social-proof" variants={fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
              <div className="landing__avatars">
                {['A','B','C','D','E'].map((l) => (
                  <div key={l} className="landing__avatar">{l}</div>
                ))}
              </div>
              <span>Join <strong>2,000+</strong> marketers & founders</span>
            </motion.div>
          </motion.div>

          {/* Hero UI Preview */}
          <motion.div
            className="landing__hero-preview"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="landing__preview-window">
              <div className="landing__preview-header">
                <div className="landing__preview-dots">
                  <span /><span /><span />
                </div>
                <span className="landing__preview-title">Gormaran AI Growth Hub</span>
              </div>
              <div className="landing__preview-body">
                <div className="landing__preview-sidebar">
                  <div className="landing__preview-cat active">📈 Marketing & Growth</div>
                  <div className="landing__preview-cat">🎯 Business Strategy</div>
                  <div className="landing__preview-cat">✍️ Content Creation</div>
                  <div className="landing__preview-cat">🛠️ Digital Tools</div>
                </div>
                <div className="landing__preview-main">
                  <div className="landing__preview-tool">
                    <div className="landing__preview-tool-header">🔍 Keyword Research</div>
                    <div className="landing__preview-input">
                      <div className="landing__preview-label">Target Keyword</div>
                      <div className="landing__preview-value">email marketing automation</div>
                    </div>
                    <div className="landing__preview-output">
                      <div className="landing__preview-line" style={{ width: '90%' }} />
                      <div className="landing__preview-line" style={{ width: '75%' }} />
                      <div className="landing__preview-line" style={{ width: '85%' }} />
                      <div className="landing__preview-line" style={{ width: '60%' }} />
                      <div className="landing__preview-line" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing__stats">
        <div className="container">
          <motion.div
            className="landing__stats-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} className="landing__stat" variants={fadeUp}>
                <div className="landing__stat-value">
                  <span className="gradient-text">{stat.value}</span>{stat.suffix}
                </div>
                <div className="landing__stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="landing__categories section" id="features">
        <div className="container">
          <AnimatedSection>
            <div className="landing__badge-wrap">
              <span className="badge badge-primary">7 Powerful Categories</span>
            </div>
            <h2 className="section-title" style={{ marginTop: '1rem' }}>
              Every Tool You Need to <span className="gradient-text">Grow</span>
            </h2>
            <p className="section-subtitle">
              Each category is precision-tuned with expert AI prompts. Not generic AI — real expertise built into every tool.
            </p>
          </AnimatedSection>

          <motion.div
            className="landing__categories-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                className="landing__category-card"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
              >
                <div className="landing__category-icon" style={{ background: `${cat.color}20`, borderColor: `${cat.color}40` }}>
                  {cat.icon}
                </div>
                <h3 className="landing__category-name">{cat.name}</h3>
                <p className="landing__category-desc">{cat.description}</p>
                <div className="landing__category-tools">
                  {cat.tools.slice(0, 3).map((tool) => (
                    <span key={tool.id} className="landing__tool-tag">{tool.icon} {tool.name}</span>
                  ))}
                  {cat.tools.length > 3 && (
                    <span className="landing__tool-tag landing__tool-tag--more">+{cat.tools.length - 3} more</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">Why <span className="gradient-text">Gormaran</span> is Different</h2>
            <p className="section-subtitle">
              We didn't just add a chat box. Every tool is purpose-engineered with expert knowledge for precise, actionable output.
            </p>
          </AnimatedSection>

          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} className="landing__feature-card" variants={fadeUp}>
                <div className="landing__feature-icon">{feature.icon}</div>
                <h3 className="landing__feature-title">{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__testimonials section">
        <div className="container">
          <AnimatedSection>
            <h2 className="section-title">Loved by <span className="gradient-text">Growth Teams</span></h2>
          </AnimatedSection>
          <motion.div
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} className="landing__testimonial" variants={fadeUp}>
                <div className="landing__testimonial-stars">★★★★★</div>
                <p className="landing__testimonial-text">"{t.text}"</p>
                <div className="landing__testimonial-author">
                  <div className="landing__testimonial-avatar">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.title}</small>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing__cta section">
        <div className="container">
          <AnimatedSection>
            <div className="landing__cta-card">
              <div className="landing__cta-orb" />
              <span className="badge badge-primary" style={{ marginBottom: '1.5rem' }}>Get Started Today</span>
              <h2 className="landing__cta-title">
                Stop Wasting Time on Manual Work.
                <br />
                <span className="gradient-text">Let AI Handle It.</span>
              </h2>
              <p>
                Join thousands of marketers, founders, and agencies growing faster with Gormaran.
                Start free — no credit card required.
              </p>
              <div className="landing__cta-actions">
                <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                  Start Free Now →
                </Link>
                <Link to="/pricing" className="btn btn-secondary btn-lg">
                  See Pricing
                </Link>
              </div>
              <small className="landing__cta-note">
                Free plan includes 5 AI requests/day · No credit card required
              </small>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
