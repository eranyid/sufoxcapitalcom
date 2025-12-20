import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-sidebar/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">SUFOX Capital Terminal</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 pb-4 border-b border-border">
            TERMS OF SERVICE
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8">
            These Terms of Service ("Terms") govern your access to and use of the SUFOX Capital Terminal (the "App"). 
            By accessing or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.
          </p>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By creating an account, accessing, or using the App, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you are using the App on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You must be at least 18 years old and have the legal capacity to enter into binding agreements to use the App.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The App is intended for use by qualified investors, financial professionals, and individuals with sufficient knowledge to understand the risks associated with investment activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your login credentials secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">4. Permitted Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may use the App solely for your personal or internal business purposes related to portfolio management, analytics, and research.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Use the App for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any systems</li>
              <li>Reverse engineer, decompile, or disassemble the App</li>
              <li>Copy, modify, or distribute the App without permission</li>
              <li>Use automated systems to access the App</li>
              <li>Interfere with or disrupt the App or servers</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The App, including all content, features, functionality, software, designs, and trademarks, is owned by SUFOX Capital and protected by intellectual property laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These Terms do not grant you any rights to use SUFOX Capital trademarks, logos, or branding without prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">6. Your Data</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You retain ownership of any data you input into the App. By using the App, you grant us a limited license to store, process, and display your data solely for the purpose of providing the service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining backups of your data. We are not liable for any loss or corruption of data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">7. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We strive to maintain high availability but do not guarantee uninterrupted access. The App may be unavailable due to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
              <li>Scheduled or emergency maintenance</li>
              <li>Technical failures or outages</li>
              <li>Third-party service disruptions</li>
              <li>Force majeure events</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the App at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">8. Fees and Payment</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Access to certain features may require payment of fees. All fees are:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
              <li>Non-refundable unless otherwise stated</li>
              <li>Subject to change with reasonable notice</li>
              <li>Exclusive of applicable taxes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Failure to pay may result in suspension or termination of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We disclaim all warranties, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Accuracy, reliability, or completeness of information</li>
              <li>Non-infringement of third-party rights</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security of data or transmissions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUFOX CAPITAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
              <li>Loss of profits, revenue, or data</li>
              <li>Business interruption</li>
              <li>Investment losses</li>
              <li>Cost of substitute services</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Our total liability shall not exceed the fees paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless SUFOX Capital and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the App, violation of these Terms, or infringement of any rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may terminate your account at any time by contacting us or using the account deletion feature.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the App ceases immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated through the App or via email. Continued use after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">15. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">16. Entire Agreement</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms, together with the Privacy Policy and Legal Disclaimer, constitute the entire agreement between you and SUFOX Capital regarding the App and supersede all prior agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">17. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us through the App or at the contact information provided on our website.
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60 text-center">
              Last updated: December 2024 • SUFOX Capital Terminal v1.0
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
