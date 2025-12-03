import React from 'react';
import './LegalPages.css';

const Support: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Support & Contact</h1>
        <p className="last-updated">We're here to help you succeed in your language certification journey.</p>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions, feedback, or need assistance with our TELC Exam Preparation apps, 
            please don't hesitate to reach out to us. We value your input and are committed to providing 
            the best possible experience.
          </p>
          <div className="contact-info">
            <p><strong>Email Support:</strong> <a href="mailto:muhammad.aref.ali.hamada@gmail.com">muhammad.aref.ali.hamada@gmail.com</a></p>
            <p><strong>Response Time:</strong> We aim to respond to all inquiries within 2-3 business days.</p>
          </div>
        </section>

        <section>
          <h2>Frequently Asked Questions (FAQ)</h2>
          
          <h3>How do I save my progress?</h3>
          <p>
            Your progress is automatically saved to your device. If you create an account and sign in, 
            your progress will be synced to the cloud, allowing you to access it across multiple devices 
            and ensuring your data is safe even if you reinstall the app.
          </p>

          <h3>Is the app free to use?</h3>
          <p>
            The app offers a significant amount of free content to help you prepare. Some advanced features 
            or additional practice sets may require a subscription or one-time purchase, which helps us 
            maintain and improve the app.
          </p>

          <h3>I found a mistake in a question. What should I do?</h3>
          <p>
            We strive for accuracy, but language is complex! If you spot an error, please email us with 
            details (screenshot or question description). We appreciate your help in improving the quality 
            for everyone.
          </p>
          
          <h3>Which exams do you support?</h3>
          <p>
            Currently, we specialize in TELC B1 German. We are actively working on B2 German and English 
            versions (B1/B2), which will be released soon.
          </p>
        </section>

        <section>
          <h2>Troubleshooting</h2>
          
          <h3>Audio is not playing</h3>
          <p>
            Please check your device's volume settings and ensure "Silent Mode" is off. If the issue persists, 
            try restarting the app. Ensure you have a stable internet connection if the audio is being streamed.
          </p>

          <h3>App is crashing or freezing</h3>
          <p>
            Ensure you have the latest version of the app installed from the App Store or Google Play. 
            If the problem continues, try clearing the app cache or reinstalling. Please contact support 
            if the issue remains.
          </p>
        </section>

        <section>
          <h2>Data Privacy</h2>
          <p>
            We take your privacy seriously. For details on how we handle your data, please review our 
            <a href="/privacy"> Privacy Policy</a> and <a href="/data-deletion">Data Deletion</a> instructions.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Support;

