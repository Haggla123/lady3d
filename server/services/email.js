import { randomBytes } from 'node:crypto'

const getFrontendUrl = (req = null) => {
  if (process.env.FRONTEND_PUBLIC_URL) {
    try {
      const configuredUrl = new URL(process.env.FRONTEND_PUBLIC_URL)
      if (['http:', 'https:'].includes(configuredUrl.protocol)) return process.env.FRONTEND_PUBLIC_URL.replace(/\/$/, '')
    } catch {}
    throw new Error('FRONTEND_PUBLIC_URL must be a valid http(s) URL for email links')
  }
  if (process.env.NODE_ENV === 'development' && req) {
    const origin = req.get('origin') || req.get('referer')
    if (origin && (origin.startsWith('http://') || origin.startsWith('https://'))) {
      try {
        const u = new URL(origin)
        return `${u.protocol}//${u.host}`
      } catch {}
    }
  }
  if (process.env.NODE_ENV === 'development') return 'http://localhost:5173'
  throw new Error('FRONTEND_PUBLIC_URL must be configured to generate email links')
}

/**
 * Send an email via Brevo transactional REST API v3
 */
export async function sendBrevoEmail({ to, toName = '', subject, htmlContent, textContent = '', replyTo = null, timeoutMs = 15000 }) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@lady3d.com'
  const senderName = process.env.BREVO_SENDER_NAME || "Lady 3D's Catering Services"

  const apiKeyMissing = !apiKey || apiKey.startsWith('replace-') || apiKey === 'your-brevo-api-key'
  // Keep local development usable, but never report a production email as delivered without credentials.
  if (apiKeyMissing && process.env.NODE_ENV === 'development') {
    console.log('\n================== [BREVO EMAIL SIMULATION] ==================')
    console.log(`To: ${toName ? `${toName} <${to}>` : to}`)
    console.log(`From: ${senderName} <${senderEmail}>`)
    console.log(`Subject: ${subject}`)
    const linkMatch = htmlContent.match(/href="([^"]+)"/)
    if (linkMatch) {
      console.log(`Primary Action Link: ${linkMatch[1]}`)
    }
    console.log('===============================================================\n')
    return { success: true, simulated: true }
  }
  if (apiKeyMissing) {
    const error = 'BREVO_API_KEY is not configured'
    console.error(`[Brevo Dispatch Failed]: ${error}`)
    return { success: false, error }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name: toName || to }],
        ...(replyTo ? { replyTo } : {}),
        subject,
        htmlContent,
        textContent: textContent || undefined
      })
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      console.error('[Brevo Error]', response.status, data)
      throw new Error(data.message || `Brevo email error: ${response.status}`)
    }
    return { success: true, messageId: data.messageId }
  } catch (err) {
    console.error('[Brevo Dispatch Failed]:', err.message)
    // Non-fatal so auth/signup flow isn't crashed by external email provider downtime
    return { success: false, error: err.message }
  }
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

export async function sendWelcomeEmail({ name, email }) {
  const htmlContent = emailLayout({
    title: 'Welcome to Lady 3D’s',
    previewText: 'Your 20% welcome voucher is ready after email verification.',
    contentHtml: `<h2 style="margin-top:0;color:#0f172a;font-size:20px;">Welcome, ${escapeHtml(name)}!</h2><p>Thanks for joining Lady 3D’s Catering Services. Your welcome voucher is:</p><div class="code-box">WELCOME20</div><p>Use this code for <b>20% off your first order</b> after verifying your email address.</p>`
  })
  return sendBrevoEmail({ to: email, toName: name, subject: 'Welcome to Lady 3D’s — your 20% voucher', htmlContent })
}

export async function sendOrderStatusEmail({ order, status, req = null }) {
  const recipientEmail = order.customerEmail || order.email
  if (!recipientEmail || !recipientEmail.includes('@')) return { success: false, skipped: true }
  const labels = {
    ready_for_collection: 'Ready for Pickup',
    ready_for_dispatch: 'Ready for Dispatch',
    out_for_delivery: 'Your order is on its way'
  }
  const label = labels[status]
  if (!label) return { success: false, skipped: true }
  const estimate = order.orderType === 'delivery'
    ? order.deliveryDetails?.estimatedMinutes
    : order.collectionDetails?.collectionTime
  const htmlContent = emailLayout({
    title: `${label} — Order ${order.ref}`,
    previewText: `${label}: order ${order.ref}.`,
    contentHtml: `<h2 style="margin-top:0;color:#0f172a;font-size:20px;">${label}</h2><p>Hello ${escapeHtml(order.name || 'Customer')},</p><p>Your order <b>#${escapeHtml(order.ref)}</b> is ${status === 'out_for_delivery' ? 'now with the driver and on its way to you' : status === 'ready_for_collection' ? 'ready to collect at the branch' : 'packed and waiting for rider pickup'}.</p>${estimate ? `<p><b>${order.orderType === 'delivery' ? 'Estimated delivery' : 'Pickup time'}:</b> ${escapeHtml(estimate)}</p>` : ''}<p>Order total: <b>GH₵ ${Number(order.total || 0).toFixed(2)}</b></p><p>Thank you for choosing Lady 3D’s.</p>`
  })
  return sendBrevoEmail({ to: recipientEmail, toName: order.name, subject: `${label}: Order #${order.ref}`, htmlContent })
}

export async function sendCateringInquiryEmail({ name, email, phone, eventDetails }) {
  const htmlContent = emailLayout({
    title: 'New Catering Event Inquiry',
    previewText: `Catering inquiry from ${name}.`,
    contentHtml: `<h2 style="margin-top:0;color:#0f172a;font-size:20px;">New Catering Event Inquiry</h2><p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p><b>Phone:</b> ${escapeHtml(phone)}</p><p><b>Event details:</b></p><p style="white-space:pre-wrap;">${escapeHtml(eventDetails)}</p>`
  })
  return sendBrevoEmail({
    to: 'hvggla@gmail.com',
    toName: 'Lady 3D Catering',
    replyTo: { email, name },
    subject: `Catering inquiry from ${name}`,
    htmlContent
  })
}

// ----------------------------------------------------
// Responsive Email Shell (Lady 3D Brand Theme)
// ----------------------------------------------------
function emailLayout({ title, previewText = '', contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b; }
    .wrapper { width:100%; table-layout:fixed; background-color:#f8fafc; padding:30px 10px; }
    .main-card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 14px rgba(0,0,0,0.05); }
    .header { background:#80141B; padding:28px 24px; text-align:center; }
    .brand-title { color:#ffffff; font-size:22px; font-weight:900; letter-spacing:0.04em; margin:0; text-transform:uppercase; }
    .brand-sub { color:#fecdd3; font-size:12px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; margin-top:4px; display:block; }
    .body { padding:36px 32px; font-size:15px; line-height:1.6; color:#334155; }
    .btn { display:inline-block; background-color:#80141B; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; margin:20px 0; text-align:center; }
    .footer { background-color:#f1f5f9; padding:20px 24px; text-align:center; font-size:12px; color:#64748b; line-height:1.5; border-top:1px solid #e2e8f0; }
    .link-alt { word-break:break-all; font-size:12px; color:#80141B; }
    .code-box { background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px; padding:12px; text-align:center; font-size:20px; font-weight:800; letter-spacing:4px; color:#80141B; margin:16px 0; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#f8fafc;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</span>
  <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <div class="main-card">
          <div class="header">
            <h1 class="brand-title">LADY 3D’S</h1>
            <span class="brand-sub">Catering Services</span>
          </div>
          <div class="body">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin:0 0 6px;">© ${new Date().getFullYear()} Lady 3D’s Catering Services · Catholic University of Ghana & Sunyani</p>
            <p style="margin:0;">Fresh local & continental Ghanaian dishes delivered hot to campus and township.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Send Registration Verification Email
 */
export async function sendVerificationEmail({ name, email, token, req = null }) {
  const frontendUrl = getFrontendUrl(req)
  const verifyUrl = `${frontendUrl}/#/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  const htmlContent = emailLayout({
    title: 'Verify Your Email - Lady 3D’s Catering Services',
    previewText: 'Verify your email address to secure your account and activate your welcome voucher.',
    contentHtml: `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Welcome to Lady 3D’s, ${escapeHtml(name)}!</h2>
      <p>Thank you for creating your account with <b>Lady 3D’s Catering Services</b>.</p>
      <p>Please confirm your email address to verify your account and activate your <b>20% Welcome Voucher</b> for your next meal:</p>
      
      <div style="text-align:center; margin:25px 0;">
        <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address →</a>
      </div>

      <p style="font-size:13px; color:#64748b;">Or paste this link into your browser if the button doesn't work:</p>
      <p><a href="${verifyUrl}" class="link-alt">${verifyUrl}</a></p>

      <div style="background:#fef2f2; border-left:4px solid #80141B; padding:12px 14px; border-radius:4px; margin-top:24px;">
        <p style="margin:0; font-size:13px; color:#991b1b;">
          <b>Special Welcome Offer:</b> Use promo code <b>WELCOME20</b> at checkout after confirming your account for 20% off your first order!
        </p>
      </div>

      <p style="margin-top:24px; font-size:12px; color:#94a3b8;">
        This verification link will expire in 24 hours. If you did not create an account with Lady 3D’s, please ignore this email.
      </p>
    `
  })

  return sendBrevoEmail({
    to: email,
    toName: name,
    subject: 'Confirm Your Email Address - Lady 3D’s Catering',
    htmlContent
  })
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail({ name, email, token, req = null }) {
  const frontendUrl = getFrontendUrl(req)
  const resetUrl = `${frontendUrl}/#/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  const htmlContent = emailLayout({
    title: 'Reset Your Password - Lady 3D’s Catering Services',
    previewText: 'Instructions to reset your Lady 3D’s Catering account password.',
    contentHtml: `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Password Reset Request</h2>
      <p>Hello ${escapeHtml(name || 'Customer')},</p>
      <p>We received a request to reset the password for your account associated with <b>${escapeHtml(email)}</b>.</p>
      <p>Click the button below to choose a new, secure password:</p>

      <div style="text-align:center; margin:25px 0;">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password →</a>
      </div>

      <p style="font-size:13px; color:#64748b;">Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}" class="link-alt">${resetUrl}</a></p>

      <p style="margin-top:24px; font-size:13px; color:#64748b;">
        This link is only valid for <b>1 hour</b>. If you did not request a password reset, no further action is required and your password remains safe.
      </p>
    `
  })

  return sendBrevoEmail({
    to: email,
    toName: name,
    subject: 'Password Reset Request - Lady 3D’s Catering',
    htmlContent
  })
}

/**
 * Send Order Confirmation & Receipt Email
 */
export async function sendOrderConfirmationEmail({ order, user = null, req = null }) {
  const frontendUrl = getFrontendUrl(req)
  const trackUrl = `${frontendUrl}/#/track/${encodeURIComponent(order.ref)}`
  const recipientEmail = order.customerEmail || order.email || user?.email

  if (!recipientEmail || !recipientEmail.includes('@')) return { success: false, skipped: true }

  const itemsList = (order.items || []).map(it => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
        <b>${it.qty}× ${escapeHtml(it.name)}</b>
        ${it.extras && it.extras.length ? `<br><small style="color:#64748b;">+ ${it.extras.map(e => escapeHtml(e.name)).join(', ')}</small>` : ''}
      </td>
      <td align="right" style="padding:10px 0; border-bottom:1px solid #f1f5f9; font-weight:700;">
        GH₵ ${Number(((it.price || it.unitPrice || 0) + (it.extras || []).reduce((sum, extra) => sum + Number(extra.price || 0), 0)) * it.qty).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const htmlContent = emailLayout({
    title: `Order #${order.ref} Confirmed - Lady 3D’s`,
    previewText: `Your order #${order.ref} has been confirmed and sent to Lady 3D’s kitchen!`,
    contentHtml: `
      <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Order Confirmed! 🍛</h2>
      <p>Thank you for ordering with Lady 3D’s Catering Services. Your order has been confirmed and sent to our kitchen team.</p>

      <div class="code-box">#${escapeHtml(order.ref)}</div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; font-size:14px;">
        ${itemsList}
        <tr>
          <td style="padding:8px 0; color:#64748b;">Subtotal</td>
          <td align="right" style="padding:8px 0; font-weight:600;">GH₵ ${Number(order.subtotal || order.total || 0).toFixed(2)}</td>
        </tr>
        ${order.discount ? `
        <tr>
          <td style="padding:8px 0; color:#16a34a;">Voucher Discount</td>
          <td align="right" style="padding:8px 0; color:#16a34a; font-weight:600;">-GH₵ ${Number(order.discount).toFixed(2)}</td>
        </tr>` : ''}
        ${order.deliveryFee ? `
        <tr>
          <td style="padding:8px 0; color:#64748b;">Delivery Fee</td>
          <td align="right" style="padding:8px 0; font-weight:600;">GH₵ ${Number(order.deliveryFee).toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 0 0; font-size:16px; font-weight:800; border-top:2px solid #e2e8f0;">Total Amount</td>
          <td align="right" style="padding:12px 0 0; font-size:18px; font-weight:900; color:#80141B; border-top:2px solid #e2e8f0;">GH₵ ${Number(order.total || 0).toFixed(2)}</td>
        </tr>
      </table>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin:20px 0; font-size:13px;">
        <p style="margin:0 0 6px;"><b>Fulfillment:</b> ${order.orderType === 'delivery' ? 'Campus / Town Delivery' : 'Counter Collection'}</p>
        ${order.orderType === 'delivery' && order.deliveryDetails?.estimatedMinutes ? `<p style="margin:0 0 6px;"><b>Estimated delivery:</b> ${escapeHtml(order.deliveryDetails.estimatedMinutes)}</p>` : ''}
        ${order.orderType === 'collection' ? `<p style="margin:0 0 6px;"><b>Pickup time:</b> ${escapeHtml(order.collectionDetails?.collectionTime || 'ASAP')}</p>` : ''}
        ${order.address ? `<p style="margin:0 0 6px;"><b>Delivery Location:</b> ${escapeHtml(order.address)}</p>` : ''}
        <p style="margin:0;"><b>Payment:</b> ${order.paid ? 'Paid' : order.pay === 'momo' ? 'Mobile Money Pending' : 'Pay on Delivery / Collection'}</p>
      </div>

      <div style="text-align:center; margin:25px 0;">
        <a href="${trackUrl}" class="btn" target="_blank">Track Order Live →</a>
      </div>
    `
  })

  return sendBrevoEmail({
    to: recipientEmail,
    toName: order.name,
    subject: `Order Confirmed: #${order.ref} - Lady 3D’s`,
    htmlContent
  })
}
