import * as XLSX from "xlsx";

export interface DetectedColumns {
  emailCol?: string;
  firstNameCol?: string;
  lastNameCol?: string;
  fullNameCol?: string;
  companyCol?: string;
  jobTitleCol?: string;
  phoneCol?: string;
  websiteCol?: string;
  cityCol?: string;
  stateCol?: string;
  countryCol?: string;
  industryCol?: string;
}

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  detectedColumns: DetectedColumns;
  samplePreview: Record<string, any>[];
}

export interface CleanedLeadRow {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  customFields: Record<string, any>;
}

/**
 * Normalizes header string to match common casing and spacing variations.
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Auto-detects standard CRM/lead columns from list of spreadsheet headers.
 */
export function detectColumns(headers: string[]): DetectedColumns {
  const detected: DetectedColumns = {};

  const patterns = {
    email: ["email", "emailaddress", "contactemail", "e-mail", "mail", "workemail", "primaryemail"],
    firstName: ["firstname", "first", "fname", "givenname"],
    lastName: ["lastname", "last", "lname", "surname", "familyname"],
    fullName: ["fullname", "name", "contactname", "person", "leadname", "clientname"],
    company: ["company", "companyname", "business", "organization", "account", "firm", "clinic"],
    jobTitle: ["jobtitle", "title", "position", "role", "designation", "occupation"],
    phone: ["phone", "phonenumber", "telephone", "mobile", "cell", "contactnumber"],
    website: ["website", "url", "domain", "companywebsite", "web", "site"],
    city: ["city", "town", "location"],
    state: ["state", "province", "region"],
    country: ["country", "nation"],
    industry: ["industry", "sector", "category", "vertical"],
  };

  for (const header of headers) {
    const norm = normalizeHeader(header);

    if (!detected.emailCol && patterns.email.includes(norm)) {
      detected.emailCol = header;
    } else if (!detected.firstNameCol && patterns.firstName.includes(norm)) {
      detected.firstNameCol = header;
    } else if (!detected.lastNameCol && patterns.lastName.includes(norm)) {
      detected.lastNameCol = header;
    } else if (!detected.fullNameCol && patterns.fullName.includes(norm)) {
      detected.fullNameCol = header;
    } else if (!detected.companyCol && patterns.company.includes(norm)) {
      detected.companyCol = header;
    } else if (!detected.jobTitleCol && patterns.jobTitle.includes(norm)) {
      detected.jobTitleCol = header;
    } else if (!detected.phoneCol && patterns.phone.includes(norm)) {
      detected.phoneCol = header;
    } else if (!detected.websiteCol && patterns.website.includes(norm)) {
      detected.websiteCol = header;
    } else if (!detected.cityCol && patterns.city.includes(norm)) {
      detected.cityCol = header;
    } else if (!detected.stateCol && patterns.state.includes(norm)) {
      detected.stateCol = header;
    } else if (!detected.countryCol && patterns.country.includes(norm)) {
      detected.countryCol = header;
    } else if (!detected.industryCol && patterns.industry.includes(norm)) {
      detected.industryCol = header;
    }
  }

  return detected;
}

/**
 * Splits a full name string (e.g., "Dr. Robert Smith, Jr." or "Jane Doe") into first and last name.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: "", lastName: "" };

  // Remove common prefixes/titles
  const clean = fullName
    .replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, "")
    .trim();

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/**
 * Validates whether an email string adheres to RFC format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (clean.includes("..")) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(clean);
}

/**
 * Parses raw Buffer of CSV or XLSX spreadsheet into structured rows and auto-detected mappings.
 */
export function parseSpreadsheetBuffer(buffer: Buffer): ParsedSpreadsheet {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawJson.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      detectedColumns: {},
      samplePreview: [],
    };
  }

  const headers = Object.keys(rawJson[0]);
  const detectedColumns = detectColumns(headers);

  return {
    headers,
    rows: rawJson,
    totalRows: rawJson.length,
    detectedColumns,
    samplePreview: rawJson.slice(0, 5),
  };
}

/**
 * Maps spreadsheet rows using selected or auto-detected column mappings into CleanedLeadRow array.
 */
export function mapRowsToLeads(
  rows: Record<string, any>[],
  columnMapping: Record<string, string> // e.g. { email: "Email Address", firstName: "Contact Name", ... }
): { validLeads: CleanedLeadRow[]; invalidCount: number } {
  const validLeads: CleanedLeadRow[] = [];
  let invalidCount = 0;

  for (const row of rows) {
    const rawEmail = String(row[columnMapping.email || ""] || "").trim().toLowerCase();

    if (!isValidEmail(rawEmail)) {
      invalidCount++;
      continue;
    }

    let firstName = columnMapping.firstName ? String(row[columnMapping.firstName] || "").trim() : "";
    let lastName = columnMapping.lastName ? String(row[columnMapping.lastName] || "").trim() : "";

    // If only fullName is mapped or firstName was full name
    if (columnMapping.fullName && !firstName) {
      const split = splitFullName(String(row[columnMapping.fullName] || ""));
      firstName = split.firstName;
      lastName = split.lastName;
    } else if (firstName && !lastName && firstName.includes(" ")) {
      const split = splitFullName(firstName);
      firstName = split.firstName;
      lastName = split.lastName;
    }

    const company = columnMapping.company ? String(row[columnMapping.company] || "").trim() : undefined;
    const jobTitle = columnMapping.jobTitle ? String(row[columnMapping.jobTitle] || "").trim() : undefined;
    const phone = columnMapping.phone ? String(row[columnMapping.phone] || "").trim() : undefined;
    const website = columnMapping.website ? String(row[columnMapping.website] || "").trim() : undefined;
    const city = columnMapping.city ? String(row[columnMapping.city] || "").trim() : undefined;
    const state = columnMapping.state ? String(row[columnMapping.state] || "").trim() : undefined;
    const country = columnMapping.country ? String(row[columnMapping.country] || "").trim() : undefined;
    const industry = columnMapping.industry ? String(row[columnMapping.industry] || "").trim() : undefined;

    // Collect all other unmapped fields into customFields
    const mappedValues = Object.values(columnMapping);
    const customFields: Record<string, any> = {};

    for (const [key, val] of Object.entries(row)) {
      if (!mappedValues.includes(key) && val !== "" && val !== null && val !== undefined) {
        customFields[key] = val;
      }
    }

    validLeads.push({
      email: rawEmail,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      phone: phone || undefined,
      website: website || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      industry: industry || undefined,
      customFields,
    });
  }

  return { validLeads, invalidCount };
}
