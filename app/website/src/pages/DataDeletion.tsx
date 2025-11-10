import React from 'react';
import './LegalPages.css';

const DataDeletion: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Data Deletion Request</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Your Right to Data Deletion</h2>
          <p>
            At TELC Exam Preparation, we respect your privacy and your right to control your personal data. 
            You have the right to request the deletion of your account and all associated personal data 
            from any of our apps (German B1, B2, English B1, B2, etc.) at any time.
          </p>
        </section>

        <section>
          <h2>2. What Data Will Be Deleted</h2>
          <p>
            When you request account deletion, we will permanently delete:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Email address, display name, profile photo</li>
            <li><strong>Progress Data:</strong> All exam scores, practice results, and progress statistics</li>
            <li><strong>User-Generated Content:</strong> Any written responses or recordings you've created</li>
            <li><strong>Authentication Data:</strong> Login credentials and associated tokens</li>
            <li><strong>Usage Data:</strong> Activity logs and app usage statistics</li>
          </ul>
        </section>

        <section>
          <h2>3. How to Request Data Deletion</h2>
  
          <h3>Email Request</h3>
          <div className="method-box">
            <p>Send an email to:</p>
            <div className="email-box">
              <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a>
            </div>
            <p>Please include the following information:</p>
            <ul>
              <li>Subject line: "Data Deletion Request - TELC Exam Preparation"</li>
              <li>Your registered email address</li>
              <li>Your display name (if applicable)</li>
              <li>Which app(s) you're using (German B1, B2, English B1, B2, etc.)</li>
              <li>Confirmation that you want to permanently delete your account</li>
            </ul>
            <p className="example">
              <strong>Example Email:</strong><br />
              <em>
                Subject: Data Deletion Request - TELC Exam Preparation<br />
                <br />
                Hello,<br />
                <br />
                I would like to request the permanent deletion of my TELC Exam Preparation account and all associated data across all apps.<br />
                <br />
                Registered Email: [your-email@example.com]<br />
                Display Name: [Your Name]<br />
                App(s): German B1<br />
                <br />
                I understand this action is irreversible.<br />
                <br />
                Thank you.
              </em>
            </p>
          </div>
        </section>

        <section>
          <h2>4. Processing Timeline</h2>
          <p>Your data will be completely deleted from our active systems within 7 business days.</p>
          <p className="important-note">
            <strong>Important:</strong> Once we confirm deletion, you will receive a final confirmation email. 
            After this, your data cannot be recovered.
          </p>
        </section>

        <section>
          <h2>5. What Happens After Deletion</h2>
          <p>Once your data is deleted:</p>
          <ul>
            <li>You will be immediately logged out of all devices</li>
            <li>You will no longer be able to access your account</li>
            <li>All your progress and scores will be permanently lost</li>
            <li>You cannot undo this action or recover your data</li>
            <li>Your email address will be freed up for future registration (if desired)</li>
          </ul>
        </section>

        <section>
          <h2>6. Data Retention Exceptions</h2>
          <p>
            In some limited cases, we may need to retain certain data for legal or security purposes:
          </p>
          <ul>
            <li><strong>Legal Obligations:</strong> Data required by law to be retained (e.g., transaction records)</li>
            <li><strong>Fraud Prevention:</strong> Minimal information to prevent abuse and protect other users</li>
            <li><strong>Legal Disputes:</strong> Data relevant to ongoing legal proceedings</li>
          </ul>
          <p>
            Such retained data will be minimal, anonymized where possible, and deleted once the retention 
            requirement expires.
          </p>
        </section>

        <section>
          <h2>7. Third-Party Services</h2>
          <p>
            If you signed in using Google or Facebook, you may also need to revoke app permissions:
          </p>
          
          <h3>For Google:</h3>
          <ol>
            <li>Go to your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account Permissions</a></li>
            <li>Find "TELC Exam Preparation" or the specific app name (e.g., "German TELC B1")</li>
            <li>Click "Remove Access"</li>
          </ol>

          <h3>For Facebook:</h3>
          <ol>
            <li>Go to Facebook Settings → Apps and Websites</li>
            <li>Find "TELC Exam Preparation" or the specific app name (e.g., "German TELC B1")</li>
            <li>Click "Remove"</li>
          </ol>
        </section>

        <section>
          <h2>8. Alternatives to Deletion</h2>
          <p>
            If you're concerned about privacy but don't want to lose your progress, consider:
          </p>
          <ul>
            <li><strong>Temporary Deactivation:</strong> Contact us to temporarily disable your account</li>
            <li><strong>Data Export:</strong> Request a copy of your data before deletion</li>
            <li><strong>Privacy Settings:</strong> Review and adjust your privacy preferences</li>
          </ul>
        </section>

        <section>
          <h2>9. Re-creating Your Account</h2>
          <p>
            After deletion, you are welcome to create a new account at any time. However:
          </p>
          <ul>
            <li>Your previous data cannot be restored</li>
            <li>You will start fresh with no progress history</li>
            <li>Your email address can be reused for registration</li>
          </ul>
        </section>

        <section>
          <h2>10. Questions or Issues</h2>
          <p>
            If you have questions about data deletion or encounter any issues with the process, 
            please contact us:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a></p>
            <p><strong>Subject Line:</strong> "Data Deletion Support"</p>
            <p><strong>Response Time:</strong> We aim to respond within 24 hours for deletion-related inquiries.</p>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Delete Your Data?</h2>
          <p>Please choose one of the methods above to submit your request.</p>
          <div className="cta-buttons">
            <a 
              href="mailto:muhammad.aref.ali.hamada@gmail.com?subject=Data%20Deletion%20Request%20-%20TELC%20Exam%20Preparation" 
              className="cta-button primary"
            >
              Send Deletion Request Email
            </a>
            <a href="/" className="cta-button secondary">
              Return to Home
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DataDeletion;

