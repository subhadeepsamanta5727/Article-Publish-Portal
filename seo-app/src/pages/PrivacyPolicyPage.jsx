import PublicPageLayout from "../components/layout/PublicPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <PublicPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains the information ReleaseMYPR collects and how it is used to provide a dependable article publishing workspace."
    >
      <p className="text-sm text-slate-500">Last updated: September 21, 2026</p>
      <h2>Information we collect</h2>
      <p>We collect account details such as your name and email address, the articles and publishing details you submit, and service activity needed to operate your account.</p>
      <h2>How we use information</h2>
      <p>Information is used to create your account, process submissions, coordinate publication services, provide support, improve the platform, and prevent misuse.</p>
      <h2>Payments</h2>
      <p>Payments are processed through our payment provider. ReleaseMYPR does not ask you to send card credentials by email or chat. Payment records may include transaction identifiers and order status so we can confirm your purchase and provide support.</p>
      <h2>Sharing and service providers</h2>
      <p>We share information only with service providers needed to run the platform, process payments, store content, or deliver publication services. We do not sell personal information.</p>
      <h2>Security and retention</h2>
      <p>We use reasonable technical and organizational safeguards and retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce our agreements.</p>
      <h2>Your choices</h2>
      <p>You may ask us to correct or delete account information, subject to records we must retain for legal, security, or transaction purposes. Contact <a href="mailto:hello@seo-portal.com">hello@seo-portal.com</a> to make a request.</p>
      <h2>Policy updates</h2>
      <p>We may update this policy when the service or applicable requirements change. The updated date at the top of this page indicates when the latest version took effect.</p>
    </PublicPageLayout>
  );
}
