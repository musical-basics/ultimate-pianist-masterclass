# Stripe $1 VIP Reservation — Setup Guide

## What You're Building
A Stripe Payment Link that collects $1 from customers who want to join the  
Ultimate Pianist VIP waitlist. The $1 locks in their spot and activates their  
credit-doubling benefit toward the DreamPlay keyboard.

---

## Step 1: Create the Product

1. Go to [stripe.com/dashboard](https://dashboard.stripe.com) → **Products**
2. Click **+ Add product**
3. Fill in:
   - **Name:** `Ultimate Pianist: VIP Waitlist Reservation`
   - **Description:** `Reserve your spot in The Ultimate Pianist Masterclass. Your $1 will be doubled as a credit toward the DreamPlay keyboard when it launches.`
   - **Image:** Upload a clean piano image or your branding logo
   - **Pricing:** One-time · `$1.00 USD`
4. Click **Save product**

---


You're in! Keep an eye on your inbox. I'll be sending you exclusive VIP details and early access soon.

-Lionel



## Step 2: Create the Payment Link

1. Go to **Payment Links** in the left sidebar
2. Click **+ New** (or **Create payment link**)
3. Select the product you just created
4. Configure settings:

### Customer Information
- ✅ Collect **email address** (required)
- ✅ Collect **name** (optional but recommended)
- ✅ **"Customers can adjust quantity"** → OFF (they can only buy 1 reservation)

### After Payment
- **Confirmation page:** Select **"Don't show confirmation page"** → choose **"Redirect customers to your website"**
- **Redirect URL:**
  ```
  https://YOUR-SITE-URL/?reserved=true
  ```
  > When customers land back on your page, a full-screen "You're in! 🎹" celebration screen will automatically appear — already built into the landing page. The `?reserved=true` param triggers it and then cleans itself from the URL.
  >
  > **Until you have a hosted URL**, you can use Stripe's built-in confirmation page temporarily — just type a title and body message instead.

### Metadata (optional but useful)
Add a metadata key: `source = vip_waitlist` so you can filter these payments later.

5. Click **Create link**
6. Copy the link — it will look like: `https://buy.stripe.com/xxxxxxxx`

---

## Step 3: Set Up a Webhook (Recommended)

To automatically send the free sheet music PDF when someone pays:

1. Go to **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-site.com/api/stripe-webhook` (or use Zapier/Make)
3. Events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. On success → trigger email with PDF attachment

**Quickest option without code:** Use [Zapier](https://zapier.com):
- Trigger: Stripe — New Payment
- Filter: product name contains "VIP Waitlist"
- Action: Send email via Gmail/Mailchimp with PDF attachment

---

## Step 4: Test It

1. Use Stripe's test mode with card `4242 4242 4242 4242`, any future date, any CVC
2. Make sure the confirmation message appears
3. Verify the webhook fires (check **Developers → Events**)
4. Flip to **Live mode** when ready

---

## Checklist Before Going Live

- [ ] Product created with correct name and description
- [ ] Price set to exactly $1.00
- [ ] Email collection enabled
- [ ] Confirmation message written
- [ ] Test payment completed successfully
- [ ] Webhook or Zapier automation triggered on payment
- [ ] Free sheet music PDF prepared and ready to send
- [ ] Payment link added to landing page CTA button
- [ ] Payment link added to YouTube video description

---

## Notes

- The $1 is a real charge — do NOT use a free/$0 link or people won't value it
- You can issue refunds later if someone requests one — Stripe makes this easy
- Consider also creating a coupon code `VIPDAY1` for a discount in case you  
  want to reward early signups in the future
