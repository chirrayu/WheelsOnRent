import React, { useState } from 'react';
import './Help.css';

const UserHelp = () => {
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  
  const [faqs, setFaqs] = useState([
    { question: 'How do I book a vehicle?', answer: 'Select a location and choose the vehicle type you want to rent.' },
    { question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards and digital wallets.' },
    { question: 'How do I return a vehicle?', answer: 'Return the vehicle to any authorized location before the due time.' },
  ]);

  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  const handleInputChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setContactForm({ subject: '', message: '' });
  };

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  return (
    <div className="user-help-page">
      <h2>Help & Support</h2>
      
      <div className="card user-contact-form">
        <h3>Contact Us</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-control"
              value={contactForm.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              className="form-control"
              value={contactForm.message}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Send Message</button>
        </form>
      </div>

      <div className="user-faq-section">
        <h3>Frequently Asked Questions</h3>
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`user-faq-item ${activeFaqIndex === index ? 'active' : ''}`}
            onClick={() => toggleFaq(index)}
          >
            <div className="user-faq-question">
              {faq.question}
              <span>{activeFaqIndex === index ? '-' : '+'}</span>
            </div>
            <div className="user-faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserHelp;