import PublicPageLayout from "../components/layout/PublicPageLayout";

export default function PaymentPolicyPage() {
  return (
    <PublicPageLayout
      eyebrow="Payments"
      title="Payment Policy"
      intro="Here is how package purchases, payment confirmation, cancellations, and refunds work on ReleaseMYPR."
    >
      <p className="text-sm text-slate-500">Last updated: September 21, 2026</p>
      <h2>Payment processing</h2>
      <p>Package and publishing payments are processed through the payment gateway shown at checkout. Prices are displayed before you confirm an order, and applicable taxes or gateway charges will be shown where relevant.</p>
      <h2>Order confirmation</h2>
      <p>An order is considered paid only after the payment provider confirms the transaction and ReleaseMYPR verifies it. A pending or failed payment does not create a confirmed publishing order.</p>
      <h2>Failed or duplicate payments</h2>
      <p>If money is debited but your order is not confirmed, contact us with your account email and payment reference. Duplicate or reversed transactions are reviewed with the payment provider and returned according to its settlement timelines.</p>
      <h2>Cancellations and refunds</h2>
      <p>Refund eligibility depends on whether work has started and on the selected package. Requests should be made as soon as possible before editorial or publisher work begins. Approved refunds are sent to the original payment method after review.</p>
      <h2>Payment support</h2>
      <p>For payment questions, email <a href="mailto:hello@seo-portal.com">hello@seo-portal.com</a> with your order or payment reference. Never include your full card number, CVV, password, or one-time password.</p>
    </PublicPageLayout>
  );
}
