import React from 'react';
import './Help.css';

const Help = () => {
  const faqs = [
    {
      question: "How do I add a new vehicle?",
      answer: "Click on the 'Add Vehicle' button in the Vehicle Management section. Fill in all required details including type, make, model, year, license plate, and daily rate."
    },
    {
      question: "How can I update pricing?",
      answer: "Use the Price Update section to either update individual vehicle rates or apply bulk updates to multiple vehicles at once."
    },
    {
      question: "What should I do if a vehicle needs maintenance?",
      answer: "In the Vehicle Management section, change the vehicle's status to 'Maintenance' so it won't be available for bookings."
    },
    {
      question: "How do I process a booking?",
      answer: "All bookings will appear in the Bookings section where you can accept, reject, or mark them as completed."
    },
    {
      question: "Can I offer discounts?",
      answer: "Yes, you can adjust daily rates in the Price Update section to offer temporary discounts."
    }
  ];
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Help & Support</h2>
      </div>

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

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Need Direct Assistance?</h3>
          <div style={styles.contactMethods}>
            {contactMethods.map((method, index) => (
              <div key={index} style={styles.contactMethod}>
                <div style={styles.contactIcon}>{method.icon}</div>
                <div style={styles.contactDetails}>
                  <h4 style={styles.contactTitle}>{method.method}</h4>
                  <p style={styles.contactDetail}>{method.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Video Tutorials</h3>
          <div style={styles.tutorials}>
            <div style={styles.tutorialCard}>
              <div style={styles.tutorialThumbnail}>▶️</div>
              <div style={styles.tutorialInfo}>
                <h4 style={styles.tutorialTitle}>Getting Started</h4>
                <p style={styles.tutorialDesc}>Learn the basics of using the vendor panel</p>
              </div>
            </div>
            <div style={styles.tutorialCard}>
              <div style={styles.tutorialThumbnail}>▶️</div>
              <div style={styles.tutorialInfo}>
                <h4 style={styles.tutorialTitle}>Managing Vehicles</h4>
                <p style={styles.tutorialDesc}>Add, edit, and maintain your vehicle inventory</p>
              </div>
            </div>
            <div style={styles.tutorialCard}>
              <div style={styles.tutorialThumbnail}>▶️</div>
              <div style={styles.tutorialInfo}>
                <h4 style={styles.tutorialTitle}>Handling Bookings</h4>
                <p style={styles.tutorialDesc}>Process reservations and manage your schedule</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Report an Issue</h3>
          <div style={styles.reportForm}>
            <textarea
              placeholder="Describe the issue you're experiencing..."
              style={styles.textarea}
              rows="4"
            ></textarea>
            <button style={styles.submitButton}>Submit Report</button>
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
    minHeight: '100vh',
    marginLeft: '280px'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: '0',
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
  contactMethods: {},
  contactMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  contactIcon: {
    fontSize: '1.5rem'
  },
  contactDetails: {},
  contactTitle: {
    margin: '0 0 4px 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  contactDetail: {
    margin: '0',
    color: '#64748b'
  },
  tutorials: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  tutorialCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  },
  tutorialThumbnail: {
    fontSize: '2rem',
    backgroundColor: '#f8fafc',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px'
  },
  tutorialInfo: {},
  tutorialTitle: {
    margin: '0 0 4px 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  tutorialDesc: {
    margin: '0',
    color: '#64748b',
    fontSize: '0.9rem'
  },
  reportForm: {},
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '16px',
    resize: 'vertical'
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Help;