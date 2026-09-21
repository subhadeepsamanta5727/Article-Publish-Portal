import PublicPageLayout from "../components/layout/PublicPageLayout";

export default function TermsOfServicePage() {
  return (
    <PublicPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms set the expectations for using ReleaseMYPR to prepare, submit, and manage publishing work."
    >
      <p className="text-sm text-slate-500">Last updated: September 21, 2026</p>
      <h2>Using the service</h2>
      <p>You must provide accurate account information, keep your login details secure, and use the service only for lawful publishing and collaboration activities.</p>
      <h2>Your content</h2>
      <p>You retain responsibility for the articles, images, links, claims, and other materials you submit. You confirm that you have the rights and permissions needed for us to review and process that content.</p>
      <h2>Publication services</h2>
      <p>Publication timelines, editorial decisions, placement, and delivery depend on the selected package and publisher. Submission through the platform does not guarantee acceptance by a publisher unless expressly stated in the package details.</p>
      <h2>Prohibited activity</h2>
      <p>Do not upload unlawful, infringing, deceptive, harmful, or malicious material, attempt to access another account, interfere with the service, or misuse publisher relationships.</p>
      <h2>Accounts and suspension</h2>
      <p>We may suspend or restrict access where necessary to protect users, publishers, the platform, or compliance requirements. You may stop using the service at any time, subject to outstanding orders and obligations.</p>
      <h2>Service availability</h2>
      <p>We work to keep ReleaseMYPR available and accurate, but maintenance, provider outages, and events outside our control may temporarily affect the service.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:hello@seo-portal.com">hello@seo-portal.com</a>.</p>
    </PublicPageLayout>
  );
}
