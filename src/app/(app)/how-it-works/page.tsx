export default function HowItWorksPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-serif text-2xl">How it works</h2>
      <div className="bg-card border rounded-lg p-6 text-sm space-y-3 text-muted-foreground">
        <p>
          <strong className="text-foreground">Sign-ups</strong> each month come from every lead
          source that is on and past its start month, × (1 + referrals per user).
          <strong className="text-foreground"> Active users</strong> = last month&apos;s minus the
          ones who finish (1 ÷ months a user stays) plus new sign-ups.
        </p>
        <p>
          <strong className="text-foreground">Lead source types:</strong> Views (your reels) = views
          ÷ 1,000 × sign-ups per 1,000 views, with views growing to a cap. Search (SEO) = visits ×
          visit-to-sign-up %. Creators = creators × views ÷ 1,000 × sign-ups per 1,000; cost =
          creators × base pay + views ÷ 1,000 × view bonus. Impressions (Meta, TikTok) = spend ÷ CPM
          × 1,000 × click-through × landing sign-up. Clicks (Google) = spend ÷ CPC ×
          click-to-sign-up. Pay per sign-up = spend ÷ price per sign-up. Fixed (in person, email) = a
          set number of sign-ups each month.
        </p>
        <p>
          <strong className="text-foreground">Plans:</strong> buyers = new sign-ups × conversion. In
          a plan&apos;s launch month it can also sell to everyone already active (setting in Costs).
          Monthly subscribers stay until they cancel; average stay = 1 ÷ monthly churn. You keep =
          price − payment fees (web or App Store) − renders × render price − other cost per sale.
        </p>
        <p>
          <strong className="text-foreground">Value per sign-up</strong> = Σ (conversion × lifetime
          value per buyer) + materials commissions per user − what a free user costs you over their
          stay.
          <strong className="text-foreground"> Value per paying user</strong> = plan value per
          sign-up ÷ share who pay.
          <strong className="text-foreground"> Return</strong> = value per sign-up ÷ cost per
          sign-up (the same as payer value ÷ cost per payer).
        </p>
        <p>
          <strong className="text-foreground">What it takes:</strong> cost per sign-up moves in
          proportion to the main rate of each source (landing sign-up %, click-to-sign-up %,
          sign-ups per 1,000 views), so the needed rate = today&apos;s rate × today&apos;s cost ÷
          target cost.
        </p>
        <p>
          <strong className="text-foreground">Test offers:</strong> early plans are scratch products
          to learn want / use / pay — not a public launch. Official launch is a journey phase you
          name after you have signal.
        </p>
      </div>
    </div>
  );
}
