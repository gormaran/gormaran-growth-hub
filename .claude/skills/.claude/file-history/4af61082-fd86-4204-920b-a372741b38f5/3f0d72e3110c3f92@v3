import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './AutomationsPage.css';

// 👇 Replace this with your real n8n webhook URL once you have it
const N8N_WEBHOOK_URL = 'https://gormaran.app.n8n.cloud/webhook/e447825a-f1ab-4c2f-b0a8-3dc0210b4ce9/chat';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function AutomationsPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your automation assistant. Tell me what you want to automate and I'll build it for you. For example: \"Send me a Slack message when I get a new Gmail from a client.\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      const reply = data?.output || data?.message || data?.text || 'Done! Your automation has been created.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Please check your n8n webhook URL is configured correctly.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="automations">
        <motion.div
          className="automations__header"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="automations__title">
              <span className="automations__title-icon">⚡</span> Automation Builder
            </h1>
            <p className="automations__subtitle">
              Describe what you want to automate in plain language — AI will build the workflow for you.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="automations__chat-card"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div className="automations__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`automations__msg automations__msg--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="automations__avatar">⚡</div>
                )}
                <div className="automations__bubble">{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="automations__msg automations__msg--assistant">
                <div className="automations__avatar">⚡</div>
                <div className="automations__bubble automations__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form className="automations__input-row" onSubmit={sendMessage}>
            <input
              className="automations__input"
              type="text"
              placeholder="Tell me what you want to automate…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              className="automations__send"
              type="submit"
              disabled={!input.trim() || loading}
            >
              Send
            </button>
          </form>
        </motion.div>

        <motion.div
          className="automations__examples"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <p className="automations__examples-label">Try asking:</p>
          <div className="automations__chips">
            {[
              'Send me a daily summary of my emails',
              'Post to Instagram when I publish a blog',
              'Alert me on Slack when a new Stripe payment arrives',
              'Save new leads from Gmail to a Google Sheet',
            ].map(example => (
              <button
                key={example}
                className="automations__chip"
                onClick={() => setInput(example)}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
