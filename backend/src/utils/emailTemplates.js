/**
 * Professional HTML Email Templates for Chatbot System
 */

const generateAdminLeadEmail = (orgName, lead) => {
  const phoneDisplay = lead.phone ? lead.phone : "Not provided";
  const companyDisplay = lead.company ? lead.company : "Not provided";
  const serviceDisplay = lead.serviceInterest || "General Inquiry";

  return {
    subject: `⚡ [New Lead] ${lead.name} sent an enquiry via Chatbot (${orgName})`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Enquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td 
              bgcolor="#2563eb" 
              style="background-color: #2563eb; padding: 28px 32px; color: #ffffff;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Pill Tag -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td bgcolor="#1d4ed8" style="background-color: #1d4ed8; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                          New Website Lead
                        </td>
                      </tr>
                    </table>

                    <!-- Organization Name -->
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
                      ${orgName}
                    </h1>

                    <!-- Subtitle -->
                    <p style="margin: 6px 0 0; font-size: 13.5px; color: #e0e7ff !important; line-height: 1.4;">
                      A prospective client submitted an enquiry through your AI assistant.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Lead Details Table -->
          <tr>
            <td style="padding:28px 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;width:34%;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                    Full Name
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#0f172a;">
                    ${lead.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                    Email Address
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#2563eb;font-weight:600;">
                    <a href="mailto:${lead.email}" style="color:#2563eb;text-decoration:none;">${lead.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                    Phone Number
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:500;">
                    ${phoneDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                    Organization
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:500;">
                    ${companyDisplay}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                    Service Needed
                  </td>
                  <td style="padding:10px 0;font-size:13px;font-weight:600;color:#1e40af;">
                    <span style="background-color:#eff6ff;padding:4px 10px;border-radius:6px;display:inline-block;border:1px solid #bfdbfe;">
                      ${serviceDisplay}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Message Section -->
              <div style="margin-top:16px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;">
                  Customer Message / Requirements
                </p>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;font-size:13.5px;color:#1e293b;line-height:1.6;white-space:pre-wrap;">
${lead.message}
                </div>
              </div>

              <!-- Quick Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${lead.email}?subject=Regarding%20your%20enquiry%20to%20${encodeURIComponent(orgName)}" 
                       style="background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block;box-shadow:0 2px 6px rgba(37,99,235,0.25);">
                      Reply to ${lead.name}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11.5px;color:#94a3b8;line-height:1.5;">
                This lead was automatically captured and sanitized by the <strong>${orgName}</strong> Chatbot Assistant.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
};

const generateClientAckEmail = (orgName, clientName) => ({
  subject: `Thank you for contacting ${orgName}`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank you for reaching out</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          
          <!-- Top Accent Header Bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg, #2563eb 0%, #38bdf8 100%);"></td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;">
                ${orgName}
              </div>

              <h2 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#1e293b;line-height:1.3;">
                We’ve received your message!
              </h2>

              <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">
                Hi <strong>${clientName}</strong>,
              </p>

              <p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.6;">
                Thank you for getting in touch with us. Our team has received your details and project requirements. One of our specialists will review your submission and contact you shortly.
              </p>

              <!-- Confirmation Note Box -->
              <div style="background-color:#f8fafc;border-left:3px solid #2563eb;border-radius:4px;padding:12px 16px;margin:20px 0 24px;">
                <p style="margin:0;font-size:12.5px;color:#475569;line-height:1.5;">
                  <strong>What's next?</strong> We generally review and respond to project enquiries within one business day.
                </p>
              </div>

              <p style="margin:0;font-size:13.5px;color:#64748b;line-height:1.5;">
                Best regards,<br/>
                <strong style="color:#1e293b;">${orgName} Support Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:18px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                You received this confirmation because an enquiry was submitted with this email on the <strong>${orgName}</strong> website.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
});

const generateExpiryWarningEmail = (orgName, expiresAt, planType) => {
  const formattedDate = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: `⚠️ Action Required: Your ${planType === "TRIAL" ? "7-Day Trial" : "Subscription"} for ${orgName} expires in 2 days`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Expiry Notice</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
          
          <!-- Top Warning Accent -->
          <tr>
            <td bgcolor="#f59e0b" style="height:6px;background-color:#f59e0b;line-height:6px;font-size:6px;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 20px;">
              <span style="background-color:#fef3c7;color:#92400e;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:4px 10px;border-radius:20px;text-transform:uppercase;display:inline-block;margin-bottom:12px;">
                Expiration Notice
              </span>
              <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">
                Your ${orgName} assistant expires on ${formattedDate}
              </h2>
              <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                This is a friendly reminder that your <strong>${planType === "TRIAL" ? "7-Day Free Trial" : "Subscription Plan"}</strong> is set to expire in <strong>48 hours</strong>.
              </p>
            </td>
          </tr>

          <!-- Impact Card -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:12px;padding:16px;">
                <tr>
                  <td>
                    <h4 style="margin:0 0 6px;font-size:13px;font-weight:700;color:#b45309;">
                      What happens after expiry?
                    </h4>
                    <ul style="margin:0;padding-left:18px;font-size:12.5px;color:#78350f;line-height:1.6;">
                      <li>Your website chatbot widget will be temporarily deactivated.</li>
                      <li>Access to your organisation dashboard and FAQ training will be locked.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instructions & Upgrade Action -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 16px;font-size:13.5px;color:#334155;line-height:1.6;">
                To ensure uninterrupted service for your website visitors, please contact the platform administrator to activate or extend your premium plan.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border-radius:10px;padding:14px;margin-bottom:20px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="font-size:12.5px;color:#475569;line-height:1.5;">
                    <strong>Support / Renewal Desk:</strong><br />
                    Email: <a href="mailto:${process.env.MAIL_FROM || process.env.SMTP_USER}" style="color:#2563eb;text-decoration:none;font-weight:600;">${process.env.MAIL_FROM || process.env.SMTP_USER}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
                Sent automatically by the Chatbot Platform for registered account <strong>${orgName}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
};

module.exports = {
  generateAdminLeadEmail,
  generateClientAckEmail,
  generateExpiryWarningEmail,
};
