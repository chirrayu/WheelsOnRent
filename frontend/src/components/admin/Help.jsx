import React, { useState } from 'react';
import './Help.css';

const Help = () => {
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  
  const [faqs, setFaqs] = useState([
    { question: 'How do I add a new vehicle?', answer: 'Click on "Add New Vehicle" button and fill in the details.' },
    { question: 'How do I update pricing?', answer: 'Go to the Price Update section and adjust the rates.' },
    { question: 'How do I check vehicle availability?', answer: 'Check the dashboard for real-time vehicle status.' },
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
    <div className="help-page">
      <h2>Help & Support</h2>
      
      <div className="card contact-form">
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

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item ${activeFaqIndex === index ? 'active' : ''}`}
            onClick={() => toggleFaq(index)}
          >
            <div className="faq-question">
              {faq.question}
              <span>{activeFaqIndex === index ? '-' : '+'}</span>
            </div>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Help;