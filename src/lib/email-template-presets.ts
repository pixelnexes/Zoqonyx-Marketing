export interface EmailTemplateConfig {
  id: string;
  name: string;
  category: "b2b_business" | "software_house_outsourcing" | "custom_dev";
  subject: string;
  logoUrl: string;
  headerColor: string;
  accentColor: string;
  senderName: string;
  senderTitle: string;
  senderPhone: string;
  companyName: string;
  companyWebsite: string;
  hourlyRate?: string;
  headline: string;
  pitchParagraph: string;
  bulletPoints: string[];
  ctaText: string;
  ctaLink: string;
}

export const EMAIL_TEMPLATE_PRESETS: EmailTemplateConfig[] = [
  {
    id: "software_house_outsourcing",
    name: "Software House & Agency Dev Outsourcing ($12/hr Cost Arbitrage)",
    category: "software_house_outsourcing",
    subject: "Dedicated Senior Devs for {{Company}} at $12/hr (Outsourcing Partnership)",
    logoUrl: "",
    headerColor: "#0f172a",
    accentColor: "#0284c7",
    senderName: "Thomas",
    senderTitle: "Head of Client Partnerships",
    senderPhone: "+1 (937) 462-0997",
    companyName: "Newix Tech Solutions",
    companyWebsite: "https://newixtechsolutions.com",
    hourlyRate: "$12/hr",
    headline: "Cut Development Costs by 70% Without Compromising Code Quality",
    pitchParagraph:
      "Hi {{First Name}}, I came across {{Company}} and wanted to reach out regarding our specialized remote engineering team in Pakistan. While US/EU development averages $40–$100/hr, our pre-vetted senior software engineers provide identical high-velocity sprint output starting at just $12/hr.",
    bulletPoints: [
      "⚡ Dedicated Senior Developers in React, Next.js, Node.js, Python & Flutter",
      "💰 $12/hr Flat Rate vs $40–$80/hr local engineering overhead",
      "🕒 Overlapping US/UK business hours with fluent English communication",
      "🛡️ Free 1-week pilot sprint before any financial commitment",
    ],
    ctaText: "Schedule a Quick 15-Min Discovery Call",
    ctaLink: "https://newixtechsolutions.com/#contact",
  },
  {
    id: "b2b_business_growth",
    name: "B2B Business Owners & Digital Marketing Growth",
    category: "b2b_business",
    subject: "Quick question regarding {{Company}}'s digital growth",
    logoUrl: "",
    headerColor: "#1e40af",
    accentColor: "#2563eb",
    senderName: "Thomas",
    senderTitle: "Growth Consultant",
    senderPhone: "+1 (937) 462-0997",
    companyName: "Newix Tech Solutions",
    companyWebsite: "https://newixtechsolutions.com",
    headline: "Transform {{Company}}'s Online Presence & Customer Acquisition",
    pitchParagraph:
      "Hi {{First Name}}, I noticed the great work you're doing at {{Company}}. We help businesses modernize their websites, automate lead funnels, and boost conversions with high-performance digital systems.",
    bulletPoints: [
      "🚀 Ultra-fast, conversion-optimized websites & CRM systems",
      "📈 Automated lead capture & multi-channel outreach pipelines",
      "🔍 Built-in Local SEO and 99.9% uptime infrastructure",
      "🤝 Dedicated account manager with guaranteed response time",
    ],
    ctaText: "Claim Your Free Digital Audit",
    ctaLink: "https://newixtechsolutions.com/#contact",
  },
  {
    id: "custom_app_engineering",
    name: "Custom Web & Mobile App Product Development",
    category: "custom_dev",
    subject: "Custom App & Web Engineering for {{Company}}",
    logoUrl: "",
    headerColor: "#065f46",
    accentColor: "#059669",
    senderName: "Thomas",
    senderTitle: "Technical Lead",
    senderPhone: "+1 (937) 462-0997",
    companyName: "Newix Tech Solutions",
    companyWebsite: "https://newixtechsolutions.com",
    headline: "From Idea to Production: Enterprise-Grade App Development",
    pitchParagraph:
      "Hi {{First Name}}, if {{Company}} is planning new custom software, mobile apps, or internal business portals, our engineering team can design, build, and deploy your complete architecture from start to finish.",
    bulletPoints: [
      "📱 iOS & Android cross-platform mobile apps (Flutter / React Native)",
      "☁️ Scalable cloud backends, microservices & REST/GraphQL APIs",
      "🔒 Enterprise security standards & automated CI/CD deployment",
      "📊 Transparent sprint tracking via Jira/Slack with daily standups",
    ],
    ctaText: "Discuss Your Project Scope",
    ctaLink: "https://newixtechsolutions.com/#contact",
  },
];

/**
 * Generates an ultra-clean, 100% email-client compatible HTML document
 */
export function generateEmailHtml(config: EmailTemplateConfig): string {
  const headerContent = config.logoUrl
    ? `<img src="${config.logoUrl}" alt="${config.companyName}" style="max-height: 48px; max-width: 220px; display: inline-block; border: 0;" />`
    : `<div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${config.companyName}</div><div style="font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Software Engineering & Digital Solutions</div>`;

  const bulletsHtml = config.bulletPoints
    .map(
      (bp) => `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; line-height: 1.5; color: #334155;">
          ${bp}
        </td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 36px; background-color: ${config.headerColor}; text-align: center;">
              ${headerContent}
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                ${config.headline}
              </h2>
              
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                ${config.pitchParagraph}
              </p>

              <!-- Highlights / Bullet Points Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #edf2f7;">
                ${bulletsHtml}
              </table>

              <!-- Call to Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${config.ctaLink}" target="_blank" style="display: inline-block; background-color: ${config.accentColor}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${config.ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign-off & Sender Card -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px;">
                <p style="font-size: 14px; color: #334155; margin: 0 0 4px 0; font-weight: 600;">
                  Best regards,
                </p>
                <p style="font-size: 14px; color: #0f172a; font-weight: 700; margin: 0;">
                  ${config.senderName}
                </p>
                <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">
                  ${config.senderTitle} | <strong>${config.companyName}</strong>
                </p>
                <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
                  📞 ${config.senderPhone} &nbsp;|&nbsp; 🌐 <a href="${config.companyWebsite}" target="_blank" style="color: ${config.accentColor}; text-decoration: none;">${config.companyWebsite.replace("https://", "")}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Unsubscribe -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0;">
                You received this commercial invitation from ${config.companyName}. If you'd prefer not to receive future updates, you may <a href="#" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
