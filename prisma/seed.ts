import { PrismaClient, Role, OrgStatus, SubscriptionStatus, BillingInterval, ProviderType, MailboxStatus, CampaignStatus, StepType, LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function encryptDummySecret(obj: object) {
  const ALGORITHM = "aes-256-gcm";
  const masterKey = crypto.createHash("sha256").update(process.env.ENCRYPTION_MASTER_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef").digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  let enc = cipher.update(JSON.stringify(obj), "utf8", "hex");
  enc += cipher.final("hex");
  return {
    encryptedPayload: enc,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

async function main() {
  console.log("🌱 Seeding Zoqonyx Email Marketing Database...");

  // 1. Seed Plans
  const plans = [
    {
      name: "FREE",
      description: "Ideal for individual outreach and initial deliverability testing.",
      priceMonthly: 0.00,
      priceYearly: 0.00,
      maxContacts: 250,
      maxMailboxes: 1,
      maxDailyEmails: 25,
      maxCampaigns: 1,
      maxTeamMembers: 1,
      hasApiAccess: false,
      hasAiAssistant: false,
    },
    {
      name: "STARTER",
      description: "For small agencies and founders scaling cold outreach sequences.",
      priceMonthly: 29.00,
      priceYearly: 290.00,
      maxContacts: 2500,
      maxMailboxes: 3,
      maxDailyEmails: 300,
      maxCampaigns: 5,
      maxTeamMembers: 2,
      hasApiAccess: false,
      hasAiAssistant: true,
    },
    {
      name: "PRO",
      description: "For high-velocity outbound teams requiring API access and sequence automation.",
      priceMonthly: 79.00,
      priceYearly: 790.00,
      maxContacts: 10000,
      maxMailboxes: 10,
      maxDailyEmails: 1500,
      maxCampaigns: 25,
      maxTeamMembers: 5,
      hasApiAccess: true,
      hasAiAssistant: true,
    },
    {
      name: "BUSINESS",
      description: "Multi-seat agency scale with unlimited campaigns and dedicated support.",
      priceMonthly: 199.00,
      priceYearly: 1990.00,
      maxContacts: 50000,
      maxMailboxes: 30,
      maxDailyEmails: 5000,
      maxCampaigns: 100,
      maxTeamMembers: 15,
      hasApiAccess: true,
      hasAiAssistant: true,
    },
    {
      name: "ENTERPRISE",
      description: "Custom volume limits, dedicated IP infrastructure, and bespoke SLAs.",
      priceMonthly: 499.00,
      priceYearly: 4990.00,
      maxContacts: 250000,
      maxMailboxes: 100,
      maxDailyEmails: 25000,
      maxCampaigns: 500,
      maxTeamMembers: 50,
      hasApiAccess: true,
      hasAiAssistant: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      create: plan,
      update: plan,
    });
  }
  console.log("✅ Commercial Plans Seeded.");

  // 2. Seed Super Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@zoqonyx.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "ZoqonyxAdmin2026!Secure";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Nawix Administrator",
      passwordHash,
      isEmailVerified: true,
      isSuperAdmin: true,
    },
    update: {
      passwordHash,
      isSuperAdmin: true,
    },
  });
  console.log(`✅ Super Admin Account Configured (${adminEmail}).`);

  // 3. Seed Demo Organization: "Navix Demo"
  const orgSlug = "navix-demo";
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    create: {
      name: "Navix Demo Solutions",
      slug: orgSlug,
      status: OrgStatus.ACTIVE,
      timezone: "America/New_York",
    },
    update: {
      name: "Navix Demo Solutions",
      status: OrgStatus.ACTIVE,
    },
  });

  // Assign Admin as Owner of Demo Org
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: adminUser.id,
      },
    },
    create: {
      organizationId: org.id,
      userId: adminUser.id,
      role: Role.OWNER,
    },
    update: { role: Role.OWNER },
  });

  // Assign PRO Plan Subscription in Test Mode
  const proPlan = await prisma.plan.findUnique({ where: { name: "PRO" } });
  if (proPlan) {
    await prisma.subscription.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        planId: proPlan.id,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isTestMode: true,
      },
      update: {
        planId: proPlan.id,
        status: SubscriptionStatus.ACTIVE,
        isTestMode: true,
      },
    });
  }

  // 4. Seed Demo Mailbox
  const demoMailboxEmail = "outreach@navixdemo.internal";
  const dummyCreds = encryptDummySecret({
    smtpHost: "smtp.hostinger.com",
    smtpPort: 587,
    smtpUser: demoMailboxEmail,
    smtpPass: "demo_password_123",
    imapHost: "imap.hostinger.com",
    imapPort: 993,
    imapUser: demoMailboxEmail,
    imapPass: "demo_password_123",
  });

  const mailbox = await prisma.mailbox.upsert({
    where: {
      organizationId_email: { organizationId: org.id, email: demoMailboxEmail },
    },
    create: {
      organizationId: org.id,
      email: demoMailboxEmail,
      fromName: "Zawar Ahmed | Nawix Tech",
      replyToEmail: "support@newixtechsolutions.com",
      providerType: ProviderType.SMTP_IMAP,
      status: MailboxStatus.ACTIVE,
      dailyLimit: 250,
      sentToday: 18,
      spfValid: true,
      dkimValid: true,
      dmarcValid: true,
      credential: {
        create: dummyCreds,
      },
    },
    update: {
      status: MailboxStatus.ACTIVE,
      spfValid: true,
      dkimValid: true,
      dmarcValid: true,
    },
  });
  console.log("✅ Demo Mailbox Seeded.");

  // 5. Seed Demo Campaign & 4-Step Sequence
  const campaign = await prisma.campaign.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      organizationId: org.id,
      name: "US Clinics – Website & AI Automation",
      description: "Automated B2B outreach cadence targeting medical directors and clinic owners across the US.",
      status: CampaignStatus.RUNNING,
      mailboxId: mailbox.id,
      dailyLimit: 150,
      timezone: "America/Chicago",
      sendingDays: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 17,
    },
    update: {
      status: CampaignStatus.RUNNING,
    },
  });

  // Steps
  const sequenceSteps = [
    {
      stepNumber: 1,
      stepType: StepType.EMAIL,
      waitDays: 0,
      subject: "Streamlining patient bookings for {{company_name | fallback:'your clinic'}}",
      bodyHtml: `<p>Hi {{first_name | fallback:'there'}},</p><p>I noticed that {{company_name | fallback:'your clinic'}} has been growing in {{city | fallback:'your area'}}. We recently partnered with several healthcare providers to automate their intake scheduling and patient follow-ups with AI.</p><p>Would you be open to a brief 5-minute chat this Thursday to see how we helped reduce front-desk admin time by 38%?</p><p>Best regards,<br><strong>Zawar Ahmed</strong><br>Nawix Tech Solution</p>`,
      bodyText: `Hi {{first_name | fallback:'there'}},\n\nI noticed that {{company_name | fallback:'your clinic'}} has been growing in {{city | fallback:'your area'}}.\n\nWould you be open to a 5-minute chat this Thursday?\n\nBest,\nZawar Ahmed`,
    },
    {
      stepNumber: 2,
      stepType: StepType.EMAIL,
      waitDays: 3,
      subject: "Quick follow-up: Automated intake for {{company_name}}",
      bodyHtml: `<p>Hi {{first_name | fallback:'there'}},</p><p>Following up on my previous note regarding modernizing patient workflows for {{company_name | fallback:'your team'}}.</p><p>Here is a 60-second summary video of our workflow: <a href="https://newixtechsolutions.com/">Watch Overview</a></p><p>Let me know if you would like me to send over a custom teardown.</p>`,
      bodyText: `Hi {{first_name}},\n\nFollowing up on my previous note regarding modernizing patient workflows.\n\nLet me know if you would like a quick demo.`,
    },
    {
      stepNumber: 3,
      stepType: StepType.EMAIL,
      waitDays: 4,
      subject: "Case Study: 40+ hours saved monthly at Dallas clinics",
      bodyHtml: `<p>Hi {{first_name | fallback:'there'}},</p><p>One of our recent clinic partners was able to reduce appointment cancellations by 42% in under 30 days using automated SMS/Email reminders.</p><p>Are you the best person at {{company_name | fallback:'your practice'}} to discuss this?</p>`,
    },
    {
      stepNumber: 4,
      stepType: StepType.EMAIL,
      waitDays: 5,
      subject: "Closing the loop for {{company_name}}",
      bodyHtml: `<p>Hi {{first_name | fallback:'there'}},</p><p>I assume you might be busy or this isn't a priority right now. I will close out our outreach here so I don't clutter your inbox.</p><p>If you ever want to explore AI intake systems down the road, feel free to reach out anytime at <a href="https://newixtechsolutions.com/">newixtechsolutions.com</a>.</p><p>Wishing you and {{company_name | fallback:'your team'}} continued success!</p>`,
    },
  ];

  for (const step of sequenceSteps) {
    await prisma.sequenceStep.upsert({
      where: {
        campaignId_stepNumber: {
          campaignId: campaign.id,
          stepNumber: step.stepNumber,
        },
      },
      create: {
        campaignId: campaign.id,
        ...step,
      },
      update: step,
    });
  }
  console.log("✅ Demo 4-Step Sequence Configured.");

  // 6. Seed Demo Leads
  const demoLeads = [
    { email: "dr.smith@dallasdentalcare.com", firstName: "Robert", lastName: "Smith", company: "Dallas Dental Care", jobTitle: "Clinical Director", city: "Dallas", state: "TX", country: "United States", industry: "Healthcare / Dental", status: LeadStatus.REPLIED },
    { email: "sarah.jenkins@austinheartclinic.org", firstName: "Sarah", lastName: "Jenkins", company: "Austin Heart & Vascular", jobTitle: "Chief Medical Officer", city: "Austin", state: "TX", country: "United States", industry: "Healthcare", status: LeadStatus.CONTACTED },
    { email: "michael.chang@houstonwellness.com", firstName: "Michael", lastName: "Chang", company: "Houston Wellness Institute", jobTitle: "Managing Partner", city: "Houston", state: "TX", country: "United States", industry: "Wellness & Physical Therapy", status: LeadStatus.CONTACTED },
    { email: "elizabeth.reed@chicagoeyeinstitute.com", firstName: "Elizabeth", lastName: "Reed", company: "Chicago Eye Institute", jobTitle: "Practice Manager", city: "Chicago", state: "IL", country: "United States", industry: "Optometry", status: LeadStatus.NEW },
    { email: "david.ross@miamipediatrics.com", firstName: "David", lastName: "Ross", company: "Miami Pediatrics Group", jobTitle: "Head Physician", city: "Miami", state: "FL", country: "United States", industry: "Pediatrics", status: LeadStatus.NEW },
    { email: "amanda.white@seattlefamilyhealth.org", firstName: "Amanda", lastName: "White", company: "Seattle Family Health Center", jobTitle: "Director of Operations", city: "Seattle", state: "WA", country: "United States", industry: "Family Medicine", status: LeadStatus.CONTACTED },
  ];

  for (const leadData of demoLeads) {
    const lead = await prisma.lead.upsert({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email: leadData.email,
        },
      },
      create: {
        organizationId: org.id,
        ...leadData,
      },
      update: leadData,
    });

    // Enroll in Demo Campaign
    await prisma.campaignLead.upsert({
      where: {
        campaignId_leadId: {
          campaignId: campaign.id,
          leadId: lead.id,
        },
      },
      create: {
        campaignId: campaign.id,
        leadId: lead.id,
        currentStepNumber: leadData.status === LeadStatus.REPLIED ? 1 : 2,
        status: leadData.status === LeadStatus.REPLIED ? "REPLIED" : "IN_PROGRESS",
      },
      update: {},
    });
  }

  // 7. Seed Inbound Conversation for Replied Lead
  const repliedLead = await prisma.lead.findFirst({
    where: { organizationId: org.id, email: "dr.smith@dallasdentalcare.com" },
  });

  if (repliedLead) {
    const conversation = await prisma.conversation.upsert({
      where: { id: "00000000-0000-0000-0000-000000000002" },
      create: {
        id: "00000000-0000-0000-0000-000000000002",
        organizationId: org.id,
        leadId: repliedLead.id,
        campaignId: campaign.id,
        mailboxId: mailbox.id,
        subject: "Re: Streamlining patient bookings for Dallas Dental Care",
        snippet: "Hi Zawar, thanks for reaching out. We have been having issues with our front desk phone overload during peak morning hours. Can you send over a demo?",
        status: "REPLIED",
        lastActivityAt: new Date(),
      },
      update: {},
    });

    await prisma.inboundEmail.create({
      data: {
        conversationId: conversation.id,
        fromEmail: repliedLead.email,
        toEmail: mailbox.email,
        subject: "Re: Streamlining patient bookings for Dallas Dental Care",
        bodyCleanText: "Hi Zawar, thanks for reaching out. We have been having issues with our front desk phone overload during peak morning hours. Can you send over a demo?",
        receivedAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    });
  }

  // 8. Seed Demo Daily Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyUsageMetric.upsert({
    where: {
      organizationId_date: { organizationId: org.id, date: today },
    },
    create: {
      organizationId: org.id,
      date: today,
      emailsSent: 42,
      emailsFailed: 0,
      repliesReceived: 3,
      bouncesDetected: 1,
      unsubscribes: 0,
    },
    update: {
      emailsSent: 42,
      repliesReceived: 3,
    },
  });

  console.log("=================================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`🔑 Super Admin Login: ${adminEmail}`);
  console.log(`🔒 Initial Password: ${adminPassword}`);
  console.log(`🏢 Demo Workspace: Navix Demo Solutions (Slug: ${orgSlug})`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
