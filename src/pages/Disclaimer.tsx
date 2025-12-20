import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Disclaimer() {
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
            <h1 className="text-lg font-semibold text-foreground">Legal Disclaimer</h1>
            <p className="text-xs text-muted-foreground">SUFOX Capital Terminal</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 pb-4 border-b border-border">
            DISCLAIMER & LEGAL NOTICE
          </h1>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">1. No Investment Advice</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The SUFOX Capital Terminal (the "App") is provided for informational, analytical, and organizational purposes only.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nothing contained in the App constitutes, or should be construed as, investment advice, financial advice, legal advice, tax advice, or a recommendation to buy, sell, or hold any security, asset, or financial instrument.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All content, analytics, metrics, dashboards, scenarios, and tools are general in nature and do not take into account your individual objectives, financial situation, or needs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">2. No Offer or Solicitation</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The App does not constitute an offer, solicitation, or recommendation to engage in any investment activity, transaction, or strategy in any jurisdiction where such offer or solicitation would be unlawful.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nothing in the App should be interpreted as:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>An offer to manage assets</li>
              <li>An offer to provide advisory services</li>
              <li>An offer to sell financial products</li>
              <li>A solicitation of investors or capital</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">3. No Guarantees & Risk Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All investments involve risk, including the possible loss of principal.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Past performance is not indicative of future results.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Any examples, scenarios, simulations, or performance metrics displayed are hypothetical, illustrative, or historical and may not reflect actual outcomes.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              No representation or warranty is made that any strategy, scenario, or analysis will achieve any particular result.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">4. Accuracy of Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              While reasonable efforts are made to ensure the accuracy and timeliness of information presented in the App, data may be incomplete, delayed, estimated, or inaccurate.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              SUFOX Capital makes no warranties regarding the accuracy, completeness, or reliability of any information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">5. User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You are solely responsible for how you use the App and for verifying any information before making decisions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The App is not a substitute for professional advice from licensed advisors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">6. No Fiduciary Relationship</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use of the App does not create any fiduciary, advisory, or client relationship between you and SUFOX Capital.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, SUFOX Capital shall not be liable for any direct or indirect damages, including financial losses, lost profits, loss of data, or business interruption arising from use of the App.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">8. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The App may rely on third-party services or data providers. SUFOX Capital is not responsible for their accuracy or availability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">9. No Regulatory Status</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              SUFOX Capital is not acting as a registered investment advisor, broker-dealer, or portfolio manager unless explicitly stated in a separate written agreement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The App is provided as a technology and analytics platform only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">10. Changes & Updates</h2>
            <p className="text-muted-foreground leading-relaxed">
              SUFOX Capital may update this disclaimer at any time. Continued use of the App constitutes acceptance of the latest version.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3">11. Jurisdiction</h2>
            <p className="text-muted-foreground leading-relaxed">
              This disclaimer is governed by applicable laws without regard to conflict of law principles.
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
