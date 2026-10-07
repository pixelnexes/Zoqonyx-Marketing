import { describe, it, expect } from "vitest";
import { detectColumns, splitFullName, isValidEmail, mapRowsToLeads } from "../../src/lib/spreadsheet-parser";

describe("SpreadsheetParser Unit Tests", () => {
  it("auto-detects standard columns from varying header formats", () => {
    const headers = ["Contact Name", "Email Address", "Company Name", "Job Title", "Phone Number"];
    const detected = detectColumns(headers);

    expect(detected.fullNameCol).toBe("Contact Name");
    expect(detected.emailCol).toBe("Email Address");
    expect(detected.companyCol).toBe("Company Name");
    expect(detected.jobTitleCol).toBe("Job Title");
  });

  it("splits full name into first and last name cleanly", () => {
    expect(splitFullName("Dr. Robert Smith, Jr.")).toEqual({ firstName: "Robert", lastName: "Smith, Jr." });
    expect(splitFullName("Sarah Jenkins")).toEqual({ firstName: "Sarah", lastName: "Jenkins" });
    expect(splitFullName("Amanda")).toEqual({ firstName: "Amanda", lastName: "" });
  });

  it("validates email RFC patterns accurately", () => {
    expect(isValidEmail("valid.email@clinic.org")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("bad@domain..com")).toBe(false);
  });

  it("maps spreadsheet rows and filters invalid records", () => {
    const rows = [
      { "Email Address": "alex@acme.com", "Contact Name": "Alex Morgan", Company: "Acme Corp" },
      { "Email Address": "invalid-entry", "Contact Name": "Bad Lead", Company: "Nowhere" },
    ];
    const mapping = {
      email: "Email Address",
      fullName: "Contact Name",
      company: "Company",
    };

    const { validLeads, invalidCount } = mapRowsToLeads(rows, mapping);
    expect(validLeads.length).toBe(1);
    expect(invalidCount).toBe(1);
    expect(validLeads[0].email).toBe("alex@acme.com");
    expect(validLeads[0].firstName).toBe("Alex");
    expect(validLeads[0].lastName).toBe("Morgan");
  });
});
