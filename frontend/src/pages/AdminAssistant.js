import React, { useEffect, useRef, useState } from 'react';
import axios from '../config/api';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const starterQuestions = [
  'Salon ke daily operations ko better kaise manage karun?',
  'Customer follow-up ka workflow suggest karo',
  'Staff scheduling ke best practices batao'
];

export default function AdminAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Namaste! Main aapka SalonPro AI Assistant hoon. Aap salon operations aur management ke baare me custom questions pooch sakte hain.'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const askQuestion = async (value = question) => {
    const text = value.trim();
    if (!text || loading) return;

    const previousMessages = messages.slice(-8);
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setQuestion('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/admin-assistant/chat', {
        message: text,
        history: previousMessages
      });
      setMessages((current) => [...current, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `Sorry, ${getApiErrorMessage(error)}`, isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askQuestion();
  };

  return (
    <section className="assistant-page">
      <header className="assistant-hero">
        <div className="assistant-hero-copy">
          <span className="assistant-hero-logo" aria-hidden="true">AI</span>
          <div>
            <p className="assistant-eyebrow">Admin workspace</p>
            <h1>SalonPro AI Assistant</h1>
            <p>Get quick, practical guidance for management and operations.</p>
          </div>
        </div>
        <span className="assistant-status"><span /> Online</span>
      </header>

      <div className="assistant-chat-card">
        <div className="assistant-chat-header">
          <div>
            <strong>New conversation</strong>
            <span>General, read-only assistant</span>
          </div>
          <button type="button" className="assistant-clear-btn" onClick={() => setMessages(messages.slice(0, 1))} disabled={loading || messages.length === 1}>
            Clear chat
          </button>
        </div>

        <div className="assistant-messages" aria-live="polite">
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`assistant-message ${item.role}${item.isError ? ' error' : ''}`}>
              <span className="assistant-message-label">{item.role === 'user' ? 'You' : 'SalonPro AI'}</span>
              <p>{item.content}</p>
            </div>
          ))}
          {loading && (
            <div className="assistant-message assistant">
              <span className="assistant-message-label">SalonPro AI</span>
              <p className="assistant-thinking"><i /><i /><i /> Thinking</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="assistant-suggestions">
            <span>Try asking</span>
            <div>
              {starterQuestions.map((item) => (
                <button key={item} type="button" onClick={() => askQuestion(item)} disabled={loading}>{item}</button>
              ))}
            </div>
          </div>
        )}

        <form className="assistant-form" onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Apna custom question likhiye…"
            maxLength={2000}
            rows={3}
            disabled={loading}
          />
          <div className="assistant-form-footer">
            <span>{question.length}/2000</span>
            <button className="btn btn-primary" type="submit" disabled={!question.trim() || loading}>
              {loading ? 'Sending…' : 'Ask AI'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
