import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">SUFOX Capital Terminal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-muted-foreground mb-8">
            Last Updated: December 2024
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              PRIVACY POLICY
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              SUFOX Capital ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the SUFOX Capital Terminal application (the "App").
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please read this Privacy Policy carefully. By accessing or using the App, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              1. Information We Collect
            </h2>
            
            <h3 className="text-lg font-medium text-foreground mb-3">1.1 Information You Provide</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may collect information that you voluntarily provide when using the App, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Account registration information (email address, name)</li>
              <li>Portfolio data and transaction records you enter</li>
              <li>Investment policy preferences and settings</li>
              <li>CRM data including projects, tasks, and notes</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-3">1.2 Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you access the App, we may automatically collect certain information, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Usage data (features accessed, time spent, interactions)</li>
              <li>Log data (IP address, access times, pages viewed)</li>
              <li>Authentication data for security purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>To provide, maintain, and improve the App's functionality</li>
              <li>To personalize your experience and deliver relevant content</li>
              <li>To process and store your portfolio and investment data</li>
              <li>To communicate with you about updates, security alerts, and support</li>
              <li>To analyze usage patterns and optimize performance</li>
              <li>To detect, prevent, and address technical issues or security threats</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              3. Data Storage and Security
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms including passkey support</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and audit logging</li>
              <li>Secure cloud infrastructure with industry-standard protections</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating the App (e.g., cloud hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> With your explicit consent for any other purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              5. Your Rights and Choices
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data in a structured format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              6. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When your information is no longer needed, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              7. Cookies and Tracking Technologies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The App may use cookies, local storage, and similar technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser preferences, though disabling certain cookies may affect App functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              8. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The App may integrate with or link to third-party services (e.g., market data providers, news feeds). These third parties have their own privacy policies, and we are not responsible for their practices. We encourage you to review their privacy policies before providing any information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              9. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The App is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              10. International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the App after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
              12. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>SUFOX Capital</strong><br />
              Email: privacy@sufox.com
            </p>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Version 1.0 | Last Updated: December 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
