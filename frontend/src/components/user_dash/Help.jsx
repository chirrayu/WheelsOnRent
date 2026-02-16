import React from 'react';
import './Help.css';

const Help = () => {
  const faqs = [
    {
      question: "How do I book a vehicle?",
      answer: "Browse available vendors and vehicles, select your preferred dates, and complete the booking process."
    },
    {
      question: "How can I contact customer support?",
      answer: "Use the chat feature or email us at support@wheelsonrent.com during business hours."
    },
    {
      question: "What documents do I need?",
      answer: "A valid driver's license and proof of insurance are required for vehicle rental."
    }
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Help & Support</h2>

      <div style={styles.content}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Frequently Asked Questions</h3>
          <div style={styles.faqList}>
            {faqs.map((faq, index) => (
              <div key={index} style={styles.faqItem}>
                <h4 style={styles.question}>{faq.question}</h4>
                <p style={styles.answer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  content: {},
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  faqList: {},
  faqItem: {
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '20px'
  },
  question: {
    margin: '0 0 8px 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  answer: {
    margin: '0',
    color: '#64748b',
    lineHeight: '1.6'
  },
  contactInfo: {},
  contactItem: {
    marginBottom: '8px',
    color: '#64748b'
  }
};

export default Help;