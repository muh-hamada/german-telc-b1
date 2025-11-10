import React from 'react';
import './LegalPages.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to TELC Exam Preparation ("we," "our," or "us"). We are committed to protecting your privacy 
            and ensuring you have a positive experience when using our mobile applications. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our TELC exam 
            preparation applications across different levels (B1, B2) and languages (German, English, and others).
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>When you create an account, we may collect:</p>
          <ul>
            <li>Email address</li>
            <li>Display name</li>
            <li>Profile photo (optional)</li>
            <li>Authentication information (when using Google, Facebook, or email sign-in)</li>
          </ul>

          <h3>2.2 Usage Data</h3>
          <p>We automatically collect information about your interaction with the app:</p>
          <ul>
            <li>Exam progress and scores</li>
            <li>Practice exercise results</li>
            <li>Time spent on different sections</li>
            <li>App usage statistics</li>
            <li>Device information (OS version, device model)</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information solely for the following purposes:</p>
          <ul>
            <li><strong>Progress Tracking:</strong> To save and display your exam preparation progress across devices</li>
            <li><strong>Account Management:</strong> To create and manage your user account</li>
            <li><strong>Service Improvement:</strong> To improve app functionality and user experience</li>
            <li><strong>Technical Support:</strong> To provide customer support and troubleshoot issues</li>
            <li><strong>Authentication:</strong> To securely verify your identity when you sign in</li>
          </ul>
          <p className="important-note">
            <strong>Important:</strong> We do NOT use your data for advertising, marketing, or any purposes 
            other than those directly related to your exam preparation and account management.
          </p>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Firebase services, which employ industry-standard security measures:
          </p>
          <ul>
            <li>Data encryption in transit and at rest</li>
            <li>Secure authentication protocols</li>
            <li>Regular security updates and monitoring</li>
            <li>Access controls and authentication</li>
          </ul>
          <p>
            We implement reasonable administrative, technical, and physical security measures designed to protect 
            your information from unauthorized access, disclosure, alteration, and destruction.
          </p>
        </section>

        <section>
          <h2>5. Data Sharing and Third Parties</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information 
            only in the following limited circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> Firebase (Google Cloud) for authentication and data storage</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Data Rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Portability:</strong> Request your data in a portable format</li>
            <li><strong>Withdrawal:</strong> Withdraw consent for data processing at any time</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a>
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide 
            you services. If you request account deletion, we will delete your data within 7 business days, 
            except where we are required to retain it for legal obligations.
          </p>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our app is intended for users who are at least 13 years old. We do not knowingly collect personal 
            information from children under 13. If you believe we have collected information from a child under 
            13, please contact us immediately.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located outside of your country. 
            We use Firebase services, which may store data in various locations worldwide. By using our app, 
            you consent to the transfer of information to countries outside your country of residence.
          </p>
        </section>

        <section>
          <h2>10. Cookies and Tracking</h2>
          <p>
            Our mobile app does not use cookies. However, we may use similar technologies for authentication 
            and to maintain your session. Third-party services we use (Firebase) may use their own tracking 
            technologies as described in their privacy policies.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review 
            this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
            please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a></p>
            <p><strong>Response Time:</strong> We aim to respond to all inquiries within 7 business days.</p>
          </div>
        </section>

        <section>
          <h2>13. Consent</h2>
          <p>
            By using our app, you consent to our Privacy Policy and agree to its terms. If you do not agree 
            with this policy, please do not use our application.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

