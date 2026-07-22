import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  PageBreak
} from 'docx';
import { Proposal, ProposalType } from '../types';
import { formatQAR } from '../proposalUtils';

// Color Palette Constants
const COLOR_PRIMARY = '1A2744'; // Deep Navy
const COLOR_GOLD = 'B8962E';    // Premium Gold
const COLOR_SLATE_DARK = '334155';
const COLOR_SLATE_MUTED = '64748B';
const COLOR_BG_LIGHT = 'F8FAFC';
const COLOR_BG_HEADER = 'F1F5F9';
const COLOR_BORDER = 'CBD5E1';

export async function exportProposalToDocx(proposal: Proposal) {
  const isBranding = proposal.type === 'branding';
  const isWebsite = proposal.type === 'website';
  const isServices = proposal.type === 'services';

  const cleanClientName = (proposal.clientName || 'Client').trim().replace(/[^a-zA-Z0-9]/g, '-');
  const fileName = `Proposal-${cleanClientName}-${proposal.id.substring(0, 8)}.docx`;

  const children: any[] = [];

  // ==========================================
  // 1. COVER / HEADER BLOCK
  // ==========================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: 'STRATEGIC PROJECT PROPOSAL',
          color: COLOR_GOLD,
          bold: true,
          size: 20,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: proposal.companyName || proposal.clientName || 'Business Project Proposal',
          bold: true,
          size: 40,
          color: COLOR_PRIMARY,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Metadata Table
  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_GOLD },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_GOLD },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createMetaCell('CLIENT NAME', proposal.clientName || 'Valued Client'),
          createMetaCell('DATE PREPARED', proposal.proposalDate || new Date().toISOString().split('T')[0]),
        ],
      }),
      new TableRow({
        children: [
          createMetaCell('PROPOSAL REF', `REF-${proposal.id.substring(0, 8).toUpperCase()}`),
          createMetaCell('PROJECT TYPE', isBranding ? 'Branding & Visual Identity' : isWebsite ? 'Website Design & Development' : 'Modular Digital Services'),
        ],
      }),
      new TableRow({
        children: [
          createMetaCell('PREPARED BY', proposal.preparedByName || 'Project Strategy Director'),
          createMetaCell('TOTAL INVESTMENT', formatQAR(proposal.totalCost), true),
        ],
      }),
    ],
  });

  children.push(metadataTable);
  children.push(createSpacer(300));

  // ==========================================
  // 2. EXECUTIVE SUMMARY / BRIEF OVERVIEW
  // ==========================================
  children.push(createSectionHeader('1. Executive Summary & Project Overview'));
  
  if (proposal.briefDescription) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: proposal.briefDescription,
            size: 22,
            color: COLOR_SLATE_DARK,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'This document presents a comprehensive technical and strategic proposal designed to elevate your brand presence, technological infrastructure, and digital operations. Our approach focuses on delivering seamless design standards, scalable architecture, security compliance, and measured business growth.',
            size: 22,
            color: COLOR_SLATE_DARK,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Key Value Highlights Callout Box
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_GOLD },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_GOLD },
        left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_PRIMARY },
        right: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 150, bottom: 150, left: 200, right: 200 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Core Project Deliverable Highlights:', bold: true, color: COLOR_PRIMARY, size: 22 }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: `Total Project Duration: Approximately ${proposal.weeks || 4} Weeks`, size: 20, color: COLOR_SLATE_DARK })],
                }),
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: `Total Investment: ${formatQAR(proposal.totalCost)} (Inclusive of agreed deliverables & terms)`, size: 20, color: COLOR_SLATE_DARK })],
                }),
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: `Quality Guarantee: Enterprise-grade code, security compliance & dedicated post-launch support.`, size: 20, color: COLOR_SLATE_DARK })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(createSpacer(300));

  // ==========================================
  // 3. DETAILED SCOPE OF WORK
  // ==========================================
  children.push(createSectionHeader('2. Detailed Scope of Work'));

  // 3A. BRANDING SCOPE
  if (isBranding && proposal.brandingScope) {
    children.push(createSubHeader('Branding & Visual Identity Scope'));
    const bScope = proposal.brandingScope;

    const brandItems: string[] = [];
    if (bScope.logoDesign) brandItems.push('Primary Logo Design & Brand Mark Concepts (Multiple iterations)');
    if (bScope.brandGuidelines) brandItems.push('Brand Guidelines & Style Guide (Color Palette, Typography, Usage Rules)');
    if (bScope.businessCards) brandItems.push('Corporate Business Card Design & Print-Ready Artwork');
    if (bScope.letterheads) brandItems.push('Official Corporate Letterhead Templates (Print & Digital PDF)');
    if (bScope.emailSignature) brandItems.push('HTML & Graphic Email Signatures for Corporate Team');
    if (bScope.envelopes) brandItems.push('Corporate Envelope & Stationery Design (DL, C4, C5)');
    if (bScope.officeStamp) brandItems.push('Official Company Stamp Seal Design');
    if (bScope.employeeIdCards) brandItems.push('Employee ID Card & Lanyard Artwork Layout');
    if (bScope.receiptsVouchers) brandItems.push('Official Receipt, Voucher & Invoice Design Layouts');

    if (bScope.additionalDeliverables) {
      bScope.additionalDeliverables.split(',').forEach(item => {
        if (item.trim()) brandItems.push(item.trim());
      });
    }

    brandItems.forEach(item => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: item, size: 20, color: COLOR_SLATE_DARK })],
          spacing: { after: 60 },
        })
      );
    });

    children.push(createSpacer(200));
  }

  // 3B. WEBSITE DESIGN & DEVELOPMENT SCOPE
  if (isWebsite && proposal.websiteScope) {
    children.push(createSubHeader('Website Design & Technical Scope'));
    const wScope = proposal.websiteScope;

    // Summary specifications
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Core Specifications: ', bold: true, color: COLOR_PRIMARY, size: 20 }),
          new TextRun({ text: `Total Planned Pages: ${wScope.totalPages || 1} | Languages: ${wScope.languages || 'English'} | CMS Architecture: ${wScope.cmsType || 'Custom Next.js / React'}`, size: 20, color: COLOR_SLATE_DARK }),
        ],
        spacing: { after: 120 },
      })
    );

    if (wScope.scopeItems && wScope.scopeItems.length > 0) {
      const selectedScope = wScope.scopeItems.filter(i => i.isSelected);
      if (selectedScope.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Selected Feature Scope & Deliverables:', bold: true, color: COLOR_PRIMARY, size: 20 })],
            spacing: { after: 80 },
          })
        );
        selectedScope.forEach(item => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${item.title}: `, bold: true, color: COLOR_SLATE_DARK, size: 20 }),
                new TextRun({ text: item.description, color: COLOR_SLATE_DARK, size: 20 }),
              ],
              spacing: { after: 60 },
            })
          );
        });
      }
    }

    children.push(createSpacer(200));
  }

  // 3C. MODULAR SERVICES SCOPE
  if (proposal.servicesScope) {
    const selectedServices = proposal.servicesScope.selectedServices || [];

    // Technical Website Audit
    if (selectedServices.includes('website_audit')) {
      children.push(createSubHeader('Technical & Security Website Audit'));
      const audit = proposal.servicesScope.websiteAudit;

      const auditChecklist: string[] = [];
      if (audit?.technicalAudit) auditChecklist.push('Technical Architecture & Code Standards Audit');
      if (audit?.seoAudit) auditChecklist.push('SEO Meta, Schema & Search Indexing Inspection');
      if (audit?.performanceSpeed) auditChecklist.push('Core Web Vitals & Load Speed Benchmarking');
      if (audit?.securityAssessment) auditChecklist.push('Security Vulnerability & SSL/TLS Configuration Check');
      if (audit?.mobileResponsiveness) auditChecklist.push('Mobile Viewport & Cross-Device Responsiveness Review');
      if (audit?.uxUiReview) auditChecklist.push('UX/UI Conversion & User Journey Optimization');
      if (audit?.accessibilityReview) auditChecklist.push('WCAG Accessibility Compliance Check');
      if (audit?.brokenLinksError) auditChecklist.push('Broken Links & Script Diagnostics');
      if (audit?.cmsPluginCheck) auditChecklist.push('CMS Core & Extension Compatibility');
      if (audit?.detailedAuditReport) auditChecklist.push('Executive Action Plan & Priority Remediation Matrix');

      auditChecklist.forEach(item => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: item, size: 20, color: COLOR_SLATE_DARK })],
            spacing: { after: 60 },
          })
        );
      });

      children.push(createSpacer(150));
    }

    // Hosting & Domain Renewal Scope + Domain Portfolio Table
    if (selectedServices.includes('hosting_domain')) {
      children.push(createSubHeader('Hosting & Domain Infrastructure Scope'));
      const hd = proposal.servicesScope.hostingDomain;

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Primary Target Domain: `, bold: true, color: COLOR_PRIMARY, size: 20 }),
            new TextRun({ text: `${hd?.domainName || 'clientdomain.com'} (${hd?.hostingRenewalYears || 1} Year Cloud Hosting)`, size: 20, color: COLOR_SLATE_DARK }),
          ],
          spacing: { after: 80 },
        })
      );

      if (hd?.serverSpecs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Server Specifications: `, bold: true, color: COLOR_PRIMARY, size: 20 }),
              new TextRun({ text: hd.serverSpecs, size: 20, color: COLOR_SLATE_DARK }),
            ],
            spacing: { after: 120 },
          })
        );
      }

      // DOMAINS PORTFOLIO TABLE IN DOCX
      const domainsList = hd?.domains || [];
      if (domainsList.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Managed Domain Portfolio & Registry Schedule:', bold: true, color: COLOR_PRIMARY, size: 20 })],
            spacing: { after: 100 },
          })
        );

        const domainRows: TableRow[] = [
          new TableRow({
            children: [
              createHeaderCell('Domain Name'),
              createHeaderCell('Renewal Date'),
              createHeaderCell('Status'),
              createHeaderCell('Renewal Cost (QAR)'),
              createHeaderCell('Notes'),
            ],
          }),
        ];

        domainsList.forEach(d => {
          domainRows.push(
            new TableRow({
              children: [
                createTableCell(d.domainName || '—', true),
                createTableCell(d.renewalDate || '—'),
                createTableCell(d.status || 'Active'),
                createTableCell(formatQAR(Number(d.renewalCost) || 0), false, AlignmentType.RIGHT),
                createTableCell(d.notes || '—'),
              ],
            })
          );
        });

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: createTableBorders(),
            rows: domainRows,
          })
        );
      }

      children.push(createSpacer(200));
    }

    // Annual Maintenance Contract (AMC) Scope
    if (selectedServices.includes('amc')) {
      children.push(createSubHeader('Annual Maintenance Contract (AMC) Scope'));
      const amc = proposal.servicesScope.amc;

      const amcFeatures = [
        'Regular CMS Core & Framework Security Updates',
        'Plugin, Extension & Library Compatibility Patches',
        'Routine Website Health Checks & Error Diagnostics',
        'Bug Fixes & Minor Content Updates',
        'Automated Daily Website & Database Backups',
        '24/7 Uptime & Performance Monitoring',
        'Monthly Technical Summary Reports',
      ];

      amcFeatures.forEach(item => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: item, size: 20, color: COLOR_SLATE_DARK })],
            spacing: { after: 60 },
          })
        );
      });

      if (amc?.responseTimeSLA) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Service Level Agreement (SLA): ', bold: true, color: COLOR_PRIMARY, size: 20 }),
              new TextRun({ text: `Guaranteed Response Time: ${amc.responseTimeSLA}`, size: 20, color: COLOR_SLATE_DARK }),
            ],
            spacing: { top: 100, after: 150 },
          })
        );
      }

      children.push(createSpacer(200));

      // AMC EXCLUSIONS PAGE / SECTION IN DOCX
      children.push(createSubHeader('AMC Scope Exclusions & Policy Boundaries (Not Included)'));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'The Annual Maintenance Contract (AMC) covers regular website maintenance, updates, security checks, backups, and minor technical fixes. The following services are NOT included under the AMC scope and will be considered as separate projects with additional quotations:',
              size: 20,
              color: COLOR_SLATE_DARK,
            }),
          ],
          spacing: { after: 150 },
        })
      );

      const exclusionsList = [
        { title: 'Major Website Restructuring', desc: 'Complete restructuring of website pages, navigation, user flow, or overall website architecture & layout redesign.' },
        { title: 'Website Redesign & UI/UX Changes', desc: 'Complete website redesign, changes to existing theme, design framework, branding elements, visual identity, or major UI/UX changes.' },
        { title: 'New Feature Development', desc: 'Development of new modules, advanced functionalities, custom plugins, integrations, or extensive custom coding.' },
        { title: 'Content Creation & Major Content Updates', desc: 'Writing new website content, blogs, articles, SEO content, large-scale content migration, professional photography, or video production.' },
        { title: 'New Page Development', desc: 'Creation of additional website pages, landing pages, campaign pages, or new service sections requiring design and development.' },
        { title: 'E-Commerce Modifications', desc: 'Adding new products in bulk, changes to payment gateways, checkout process, shipping integrations, or store restructuring.' },
        { title: 'Third-Party Software & Server Issues', desc: 'Issues caused by third-party services, external APIs, hosting limitations, or server-side configurations beyond our control.' },
        { title: 'Security Recovery & Malware Removal', desc: 'Complete website recovery after major hacking incidents or malware attacks (treated as a separate security project).' },
        { title: 'SEO & Digital Marketing Services', desc: 'SEO campaigns, keyword optimization, backlink building, Google Ads, and social media marketing activities.' },
        { title: 'Additional Development Hours', desc: 'Any development work exceeding the agreed AMC scope or monthly allocated hours will be quoted separately.' },
      ];

      exclusionsList.forEach(item => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: `[Excluded] ${item.title}: `, bold: true, color: '991B1B', size: 20 }),
              new TextRun({ text: item.desc, size: 20, color: COLOR_SLATE_DARK }),
            ],
            spacing: { after: 80 },
          })
        );
      });

      // Additional Work Requests Callout
      children.push(createSpacer(100));
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_GOLD },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_GOLD },
            left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_GOLD },
            right: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'FFFBEB', type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 180, right: 180 },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'Additional Work Requests Policy:', bold: true, color: COLOR_PRIMARY, size: 20 })],
                      spacing: { after: 60 },
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: 'Any requirement outside the defined AMC scope, including website redesign, structural changes, new functionalities, integrations, or major improvements, will be assessed separately and provided as an independent quotation.', size: 20, color: COLOR_SLATE_DARK })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );

      children.push(createSpacer(200));
    }

    // Custom Service
    if (selectedServices.includes('custom_service') && proposal.servicesScope.customService) {
      const cs = proposal.servicesScope.customService;
      children.push(createSubHeader(cs.title || 'Custom Service Scope'));
      
      if (cs.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cs.description, size: 20, color: COLOR_SLATE_DARK })],
            spacing: { after: 100 },
          })
        );
      }

      if (cs.deliverables) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Key Deliverables: ', bold: true, color: COLOR_PRIMARY, size: 20 }),
              new TextRun({ text: cs.deliverables, size: 20, color: COLOR_SLATE_DARK }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      children.push(createSpacer(200));
    }
  }

  // ==========================================
  // 4. PROJECT TIMELINE & MILESTONES
  // ==========================================
  children.push(createSectionHeader('3. Project Timeline & Phase Execution'));

  if (proposal.milestones && proposal.milestones.length > 0) {
    const milestoneRows: TableRow[] = [
      new TableRow({
        children: [
          createHeaderCell('Phase / Timeline'),
          createHeaderCell('Milestone Title'),
          createHeaderCell('Phase Scope & Deliverables'),
        ],
      }),
    ];

    proposal.milestones.forEach(m => {
      milestoneRows.push(
        new TableRow({
          children: [
            createTableCell(m.week || 'Phase', true),
            createTableCell(m.title || 'Milestone', true),
            createTableCell(m.description || 'Deliverable items'),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: createTableBorders(),
        rows: milestoneRows,
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Total estimated completion timeline is ${proposal.weeks || 4} weeks from official project initiation and deposit payment.`, size: 20, color: COLOR_SLATE_DARK }),
        ],
        spacing: { after: 150 },
      })
    );
  }

  children.push(createSpacer(300));

  // ==========================================
  // 5. COMMERCIAL FINANCIALS & PAYMENT SCHEDULE
  // ==========================================
  children.push(createSectionHeader('4. Investment & Payment Terms'));

  // Financial Breakdown Table
  const financeRows: TableRow[] = [
    new TableRow({
      children: [
        createHeaderCell('Service Module / Fee Item'),
        createHeaderCell('Investment Amount (QAR)'),
      ],
    }),
  ];

  if (isBranding) {
    financeRows.push(
      new TableRow({
        children: [
          createTableCell('Brand Strategy, Visual Identity & Creative Assets', true),
          createTableCell(formatQAR(proposal.totalCost), true, AlignmentType.RIGHT),
        ],
      })
    );
  } else if (isWebsite) {
    financeRows.push(
      new TableRow({
        children: [
          createTableCell('Website Design, Front-End & Back-End Development', true),
          createTableCell(formatQAR(proposal.developmentCost || 0), false, AlignmentType.RIGHT),
        ],
      })
    );
    if (proposal.pluginCost) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell('Plugins, Modules & Third-Party Integrations', true),
            createTableCell(formatQAR(proposal.pluginCost), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
    if (proposal.maintenanceCost) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell(`Maintenance & Support SLA (${proposal.websiteScope?.maintenancePeriod || 12} Months)`, true),
            createTableCell(formatQAR(proposal.maintenanceCost), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
  } else if (isServices && proposal.servicesScope) {
    const sScope = proposal.servicesScope;
    const selected = sScope.selectedServices || [];
    if (selected.includes('website_audit')) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell('Technical Website & Security Audit', true),
            createTableCell(formatQAR(sScope.websiteAudit?.cost || 0), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
    if (selected.includes('hosting_domain')) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell('Cloud Hosting & Managed Domain Portfolio Registry', true),
            createTableCell(formatQAR(sScope.hostingDomain?.cost || 0), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
    if (selected.includes('ssl_renewal')) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell('SSL Certificate Provisioning & Security Installation', true),
            createTableCell(formatQAR(sScope.sslRenewal?.cost || 0), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
    if (selected.includes('amc')) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell('Annual Maintenance Contract (AMC)', true),
            createTableCell(formatQAR(sScope.amc?.cost || 0), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
    if (selected.includes('custom_service') && sScope.customService) {
      financeRows.push(
        new TableRow({
          children: [
            createTableCell(sScope.customService.title || 'Custom Service Module', true),
            createTableCell(formatQAR(sScope.customService.cost || 0), false, AlignmentType.RIGHT),
          ],
        })
      );
    }
  }

  // Total Summary Row
  financeRows.push(
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'TOTAL COMMERCIAL INVESTMENT (NET QAR)', bold: true, color: COLOR_PRIMARY, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: formatQAR(proposal.totalCost), bold: true, color: COLOR_GOLD, size: 22 })],
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: financeRows,
    })
  );

  children.push(createSpacer(200));

  // Payment Terms Callout
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Payment Milestone Installments: ', bold: true, color: COLOR_PRIMARY, size: 20 }),
        new TextRun({ text: proposal.paymentTerms || '50% Advance Upon Commencement | 50% Upon Final Review & Handover', size: 20, color: COLOR_SLATE_DARK }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(createSpacer(300));

  // ==========================================
  // 6. ACCEPTANCE & SIGNATURES BLOCK
  // ==========================================
  children.push(createSectionHeader('5. Agreement & Project Authorization'));

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'By signing below, the Client approves the project scope, timeline, investment total, and terms outlined in this proposal document.',
          size: 20,
          color: COLOR_SLATE_DARK,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'PREPARED & AUTHORIZED BY:', bold: true, color: COLOR_PRIMARY, size: 18 })], spacing: { after: 120 } }),
              new Paragraph({ children: [new TextRun({ text: proposal.preparedByName || 'Project Strategy Director', bold: true, size: 20, color: COLOR_SLATE_DARK })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text: proposal.preparedByCompany || 'Digital Solutions Agency', size: 18, color: COLOR_SLATE_MUTED })], spacing: { after: 200 } }),
              new Paragraph({ children: [new TextRun({ text: 'Signature: __________________________', size: 18, color: COLOR_SLATE_MUTED })] }),
              new Paragraph({ children: [new TextRun({ text: `Date: ${proposal.proposalDate || new Date().toISOString().split('T')[0]}`, size: 18, color: COLOR_SLATE_MUTED })], spacing: { top: 60 } }),
            ],
          }),
          new TableCell({
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'ACCEPTED & APPROVED BY CLIENT:', bold: true, color: COLOR_PRIMARY, size: 18 })], spacing: { after: 120 } }),
              new Paragraph({ children: [new TextRun({ text: proposal.clientName || 'Client Representative Name', bold: true, size: 20, color: COLOR_SLATE_DARK })], spacing: { after: 60 } }),
              new Paragraph({ children: [new TextRun({ text: proposal.companyName || 'Client Organization', size: 18, color: COLOR_SLATE_MUTED })], spacing: { after: 200 } }),
              new Paragraph({ children: [new TextRun({ text: 'Signature: __________________________', size: 18, color: COLOR_SLATE_MUTED })] }),
              new Paragraph({ children: [new TextRun({ text: 'Date: ________________________', size: 18, color: COLOR_SLATE_MUTED })], spacing: { top: 60 } }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(signatureTable);

  // ==========================================
  // BUILD DOCUMENT & TRIGGER DOWNLOAD
  // ==========================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${proposal.companyName || proposal.clientName || 'Project Proposal'} | Strategic Scope & Terms`,
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Confidential & Proprietary  |  Page ', size: 16, color: COLOR_SLATE_MUTED }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                  }),
                  new TextRun({ text: ' of ', size: 16, color: COLOR_SLATE_MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper formatting functions for docx
function createSectionHeader(title: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 26,
        color: COLOR_PRIMARY,
      }),
    ],
    spacing: { top: 300, after: 150 },
  });
}

function createSubHeader(title: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22,
        color: COLOR_GOLD,
      }),
    ],
    spacing: { top: 200, after: 100 },
  });
}

function createSpacer(twips: number = 200) {
  return new Paragraph({
    spacing: { after: twips },
  });
}

function createMetaCell(label: string, value: string, isGold: boolean = false) {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, size: 16, color: COLOR_SLATE_MUTED, bold: true }),
          new TextRun({ text: value, size: 18, color: isGold ? COLOR_GOLD : COLOR_PRIMARY, bold: true }),
        ],
      }),
    ],
  });
}

function createHeaderCell(text: string) {
  return new TableCell({
    shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 }),
        ],
      }),
    ],
  });
}

function createTableCell(text: string, isBold: boolean = false, align: AlignmentType = AlignmentType.LEFT) {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text, bold: isBold, size: 18, color: COLOR_SLATE_DARK }),
        ],
      }),
    ],
  });
}

function createTableBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
  };
}
