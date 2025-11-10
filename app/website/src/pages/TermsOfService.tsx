import React from 'react';
import './LegalPages.css';

const TermsOfService: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            Welcome to TELC Exam Preparation. By accessing or using our mobile applications, you agree to be bound 
            by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our apps.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and TELC Exam Preparation ("we," "us," or "our") 
            regarding your use of our applications across different levels (B1, B2) and languages (German, English, and others).
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            TELC Exam Preparation offers a suite of mobile applications designed to help users prepare for TELC 
            language examinations across different levels (B1, B2) and languages (German, English, and others). 
            Our apps provide:
          </p>
          <ul>
            <li>Reading comprehension exercises</li>
            <li>Writing practice materials</li>
            <li>Listening comprehension activities</li>
            <li>Speaking preparation resources</li>
            <li>Grammar exercises</li>
            <li>Progress tracking and statistics</li>
            <li>Mock exam simulations</li>
            <li>Level-specific content for B1, B2, and more</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            To use certain features of the app, you must create an account. You may register using:
          </p>
          <ul>
            <li>Email and password</li>
            <li>Google account</li>
            <li>Facebook account</li>
          </ul>

          <h3>3.2 Account Responsibilities</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Ensuring your account information is accurate and up-to-date</li>
          </ul>

          <h3>3.3 Account Eligibility</h3>
          <p>
            You must be at least 13 years old to create an account. If you are under 18, you must have 
            permission from a parent or guardian to use the app.
          </p>
        </section>

        <section>
          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the app for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Attempt to gain unauthorized access to the app or related systems</li>
            <li>Interfere with or disrupt the app's operation</li>
            <li>Reverse engineer, decompile, or disassemble the app</li>
            <li>Copy, modify, or distribute the app's content without permission</li>
            <li>Use automated systems or software to extract data from the app</li>
            <li>Share your account with others</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property Rights</h2>
          <h3>5.1 Our Content</h3>
          <p>
            All content in our apps, including but not limited to text, graphics, logos, audio clips, and 
            software, is the property of TELC Exam Preparation or its content suppliers and is protected by 
            international copyright, trademark, and other intellectual property laws.
          </p>

          <h3>5.2 License to Use</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to access and use our apps 
            for personal, non-commercial purposes. This license does not include:
          </p>
          <ul>
            <li>Resale or commercial use of the apps or their content</li>
            <li>Collection and use of product listings or descriptions</li>
            <li>Making derivative works</li>
            <li>Downloading or copying account information for the benefit of another party</li>
          </ul>
        </section>

        <section>
          <h2>6. Educational Content Disclaimer</h2>
          <p className="important-note">
            <strong>Important:</strong> TELC Exam Preparation apps are preparation tools and are not affiliated with, 
            endorsed by, or officially connected to TELC GmbH or any official TELC examination body.
          </p>
          <p>
            While we strive to provide accurate and helpful preparation materials across all levels and languages:
          </p>
          <ul>
            <li>We do not guarantee exam success</li>
            <li>We do not issue official certifications</li>
            <li>Practice materials may not exactly reflect actual exam content</li>
            <li>Results in our apps do not predict actual exam performance</li>
          </ul>
        </section>

        <section>
          <h2>7. Payment and Subscriptions</h2>
          <p>
            Currently, our TELC Exam Preparation apps are free to use. If we introduce paid features or subscriptions 
            in the future:
          </p>
          <ul>
            <li>Pricing will be clearly displayed before purchase</li>
            <li>Payments will be processed through App Store or Google Play</li>
            <li>Refund policies will follow platform guidelines</li>
            <li>We reserve the right to modify pricing at any time</li>
          </ul>
        </section>

        <section>
          <h2>8. Data and Privacy</h2>
          <p>
            Your use of our apps is also governed by our Privacy Policy. By using our apps, you consent 
            to our collection and use of personal data as outlined in the Privacy Policy.
          </p>
          <p>
            We collect and use your data solely for:
          </p>
          <ul>
            <li>Saving your exam preparation progress across different apps and levels</li>
            <li>Providing personalized learning experiences</li>
            <li>Improving app functionality</li>
            <li>Providing customer support</li>
          </ul>
        </section>

        <section>
          <h2>9. Disclaimers and Limitations of Liability</h2>
          <h3>9.1 "As Is" Basis</h3>
          <p>
            Our apps are provided on an "as is" and "as available" basis without warranties of any kind, 
            either express or implied, including but not limited to:
          </p>
          <ul>
            <li>Merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Accuracy, reliability, or availability</li>
          </ul>

          <h3>9.2 Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, TELC Exam Preparation shall not be liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, data, use, or other intangible losses</li>
            <li>Damages resulting from your use or inability to use our apps</li>
            <li>Unauthorized access to or alteration of your data</li>
          </ul>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless TELC Exam Preparation and its affiliates, officers, 
            directors, employees, and agents from any claims, liabilities, damages, losses, and expenses 
            arising out of or related to:
          </p>
          <ul>
            <li>Your use or misuse of our apps</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your violation of any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2>11. Modifications to Service</h2>
          <p>
            We reserve the right to:
          </p>
          <ul>
            <li>Modify or discontinue any of our apps (or any part) at any time</li>
            <li>Change these Terms at any time</li>
            <li>Impose limits on certain features</li>
            <li>Restrict access to parts or all of our apps</li>
          </ul>
          <p>
            We will provide notice of significant changes to these Terms. Your continued use of our apps 
            after such notice constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2>12. Termination</h2>
          <h3>12.1 By You</h3>
          <p>
            You may terminate your account at any time by:
          </p>
          <ul>
            <li>Contacting us at muhammad.aref.ali.hamada@gmail.com</li>
            <li>Following the account deletion process in any of our apps</li>
          </ul>

          <h3>12.2 By Us</h3>
          <p>
            We may terminate or suspend your account immediately, without prior notice, if you:
          </p>
          <ul>
            <li>Breach these Terms</li>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Violate our policies</li>
            <li>Create risk or legal exposure for us</li>
          </ul>
        </section>

        <section>
          <h2>13. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes 
            arising out of or relating to these Terms or the app shall be resolved through:
          </p>
          <ol>
            <li>Good faith negotiations</li>
            <li>Mediation (if negotiations fail)</li>
            <li>Binding arbitration or litigation as a last resort</li>
          </ol>
        </section>

        <section>
          <h2>14. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall 
            be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise 
            remain in full force and effect.
          </p>
        </section>

        <section>
          <h2>15. Contact Information</h2>
          <p>
            For questions, concerns, or feedback regarding these Terms of Service, please contact us:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a></p>
            <p><strong>Response Time:</strong> We aim to respond within 7 business days.</p>
          </div>
        </section>

        <section>
          <h2>16. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
            TELC Exam Preparation regarding the use of our apps, superseding any prior agreements.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;

