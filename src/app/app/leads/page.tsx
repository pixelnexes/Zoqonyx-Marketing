"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Upload,
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Building,
  Mail,
  Phone,
  Globe,
  Tag,
  Sparkles,
  ExternalLink,
  Trash2,
  FolderOpen,
  FolderPlus,
  Layers,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/toast";

export default function LeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [pagination, setPagination] = useState<any>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Import wizard state
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<any>({});
  const [targetCategoryFolder, setTargetCategoryFolder] = useState<string>("Uploaded Leads");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newCategory, setNewCategory] = useState("Cafes & Coffee Shops");

  const fetchCategories = () => {
    fetch("/api/v1/leads/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  };

  const fetchLeads = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "25",
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(selectedCategory !== "ALL" ? { category: selectedCategory } : {}),
    });

    fetch(`/api/v1/leads?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) {
          setLeads(data.leads);
          setPagination({
            total: data.total || data.leads.length,
            page: data.page || page,
            limit: data.limit || 25,
            totalPages: data.totalPages || 1,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLeads(1);
    setSelectedLeadIds([]);
  }, [search, statusFilter, selectedCategory]);

  // Delete Single Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"?`)) return;
    try {
      const res = await fetch("/api/v1/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      toast.success("Lead Deleted", `Lead "${name}" removed.`);
      fetchLeads(pagination.page);
      fetchCategories();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  // Delete Bulk Leads
  const handleDeleteSelected = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Delete ${selectedLeadIds.length} selected leads?`)) return;
    try {
      const res = await fetch("/api/v1/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedLeadIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete leads");
      toast.success("Leads Deleted", `Successfully deleted ${selectedLeadIds.length} leads.`);
      setSelectedLeadIds([]);
      fetchLeads(1);
      fetchCategories();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  // Delete Folder / Category
  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Delete all leads in category folder "${catName}"?`)) return;
    try {
      const res = await fetch("/api/v1/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catName }),
      });
      if (!res.ok) throw new Error("Failed to delete category");
      toast.success("Folder Removed", `Category "${catName}" deleted.`);
      setSelectedCategory("ALL");
      fetchLeads(1);
      fetchCategories();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  // Safe Exporter for CSV / Excel
  const handleExport = (format: "csv" | "xlsx") => {
    try {
      const exportData = leads.map((l) => ({
        "Business / Name": l.company || l.firstName || "N/A",
        "First Name": l.firstName || "",
        "Last Name": l.lastName || "",
        "Email Address": l.email,
        "Phone Number": l.phone || "",
        "Website URL": l.website || "",
        "Category / Folder": l.industry || "",
        "City": l.city || "",
        "Country": l.country || "",
        "Status": l.status,
        "Top Opportunity": l.customFields?.top_opportunity || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      const catLabel = selectedCategory === "ALL" ? "all_leads" : selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const filename = `zoqonyx_${catLabel}_${Date.now()}.${format}`;
      XLSX.writeFile(workbook, filename);
      toast.success("Export Complete", `Exported ${exportData.length} leads to ${filename}`);
    } catch (err: any) {
      toast.error("Export Failed", err.message);
    }
  };

  // File Upload Parser
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          toast.error("Empty File", "The uploaded spreadsheet contains no rows.");
          return;
        }

        const headers = Object.keys(json[0]);
        setParsedHeaders(headers);
        setParsedRows(json);

        // Auto-detect columns
        const mapping: Record<string, string> = {};
        for (const h of headers) {
          const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!mapping.email && (norm.includes("email") || norm.includes("mail"))) mapping.email = h;
          if (!mapping.name && (norm === "name" || norm === "fullname" || norm.includes("business") || norm.includes("company"))) mapping.name = h;
          if (!mapping.phone && (norm.includes("phone") || norm.includes("mobile"))) mapping.phone = h;
          if (!mapping.website && (norm.includes("website") || norm.includes("domain") || norm.includes("site"))) mapping.website = h;
          if (!mapping.category && (norm.includes("category") || norm.includes("niche") || norm.includes("industry"))) mapping.category = h;
          if (!mapping.city && norm.includes("city")) mapping.city = h;
        }
        setColumnMapping(mapping);
        setWizardStep(2);
        toast.info("Columns Detected", `Loaded ${json.length} rows with ${headers.length} columns.`);
      } catch (err: any) {
        toast.error("File Parse Error", err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm Import
  const handleExecuteImport = async () => {
    if (!columnMapping.email) {
      toast.error("Missing Mapping", "Please map the Email Address column before importing.");
      return;
    }

    setImporting(true);
    try {
      const mappedLeads = parsedRows.map((row) => {
        const fullName = String(row[columnMapping.name] || "").trim();
        const names = fullName.split(" ");
        return {
          email: String(row[columnMapping.email] || "").trim(),
          firstName: names[0] || fullName || undefined,
          lastName: names.slice(1).join(" ") || undefined,
          company: fullName || undefined,
          phone: columnMapping.phone ? String(row[columnMapping.phone] || "").trim() : undefined,
          website: columnMapping.website ? String(row[columnMapping.website] || "").trim() : undefined,
          industry: targetCategoryFolder || (columnMapping.category ? String(row[columnMapping.category] || "").trim() : "Uploaded Leads"),
          city: columnMapping.city ? String(row[columnMapping.city] || "").trim() : undefined,
          tags: ["Spreadsheet Ingestion", targetCategoryFolder],
        };
      });

      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: mappedLeads, source: "CSV_IMPORT" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportResult(data.result);
      setWizardStep(3);
      toast.success("Import Finished", `Successfully imported ${data.result?.imported || 0} leads.`);
      fetchLeads(1);
      fetchCategories();
    } catch (err: any) {
      toast.error("Import Error", err.message);
    } finally {
      setImporting(false);
    }
  };

  // Manual Add Lead
  const handleAddManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName,
          lastName: newLastName,
          company: newCompany,
          jobTitle: newTitle,
          phone: newPhone,
          website: newWebsite,
          industry: newCategory,
          source: "MANUAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add lead");

      setShowAddModal(false);
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewCompany("");
      setNewPhone("");
      setNewWebsite("");
      toast.success("Lead Created", `Added ${newEmail} to database.`);
      fetchLeads(1);
      fetchCategories();
    } catch (err: any) {
      toast.error("Create Lead Failed", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Leads & Prospect Folders</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organized lead bank with multi-industry folder tags, deduplication, and bulk export capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExport("csv")}
            className="btn-secondary text-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport("xlsx")}
            className="btn-secondary text-xs"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>Add Single Lead</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setImportFile(null);
              setImportResult(null);
              setShowImportWizard(true);
            }}
            className="btn-sky text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY / FOLDER TABS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Prospect Industry Folders</span>
          </span>
          <span className="text-slate-400 text-[11px]">Total Bank: {pagination.total} prospects</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Leads ({pagination.total})</span>
          </button>

          {categories.map((c) => (
            <div key={c.name} className="relative group shrink-0">
              <button
                onClick={() => setSelectedCategory(c.name)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
                  selectedCategory === c.name
                    ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === c.name ? "bg-sky-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by company, contact name, email, city, or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-600 shadow-2xs"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>

          {selectedLeadIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete ({selectedLeadIds.length})</span>
            </button>
          )}

          {selectedCategory !== "ALL" && (
            <button
              onClick={() => handleDeleteCategory(selectedCategory)}
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs hover:text-red-600 hover:border-red-200 transition"
              title="Delete entire folder"
            >
              Delete Folder
            </button>
          )}
        </div>
      </div>

      {/* 4. Leads Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Company / Business</th>
                <th className="p-3.5">Primary Contact</th>
                <th className="p-3.5">Category / Folder</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Top Opportunity & Pitch</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Loading prospect records...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No leads found in this folder. Click &quot;Import Spreadsheet&quot; to ingest leads.
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const isSelected = selectedLeadIds.includes(l.id);
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-sky-50/50" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(l.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>

                      {/* Company & Website */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{l.company || l.firstName || "Company"}</span>
                        </div>
                        {l.website && (
                          <a
                            href={l.website.startsWith("http") ? l.website : `https://${l.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-sky-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-3 h-3 text-sky-500" />
                            <span className="truncate max-w-[150px]">
                              {l.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "")}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">
                          {l.firstName} {l.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{l.email}</span>
                        </div>
                        {l.phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{l.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {l.industry || "General"}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        <div>{l.city || "United States"}</div>
                        <div className="text-[10px] text-slate-400">{l.country || "US"}</div>
                      </td>

                      {/* Top Opportunity */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="text-[11px] font-medium text-slate-800 line-clamp-1">
                          {l.customFields?.top_opportunity || "Website Optimization"}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {l.customFields?.pitch || "Personalized outreach proposal"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            l.status === "NEW"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : l.status === "CONTACTED"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : l.status === "REPLIED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteLead(l.id, l.company || l.email)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total leads)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-2xs">
              {pagination.page}
            </span>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. IMPORT SPREADSHEET WIZARD MODAL */}
      {showImportWizard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clean-card p-6 rounded-xl max-w-xl w-full border border-slate-200 bg-white shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Import Prospect Spreadsheet</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload CSV or Excel files. All new rows will be appended safely to your lead bank.
                </p>
              </div>
              <button
                onClick={() => setShowImportWizard(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* STEP 1: UPLOAD */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-sky-500 transition cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <FileSpreadsheet className="w-10 h-10 text-sky-600 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-800 block">
                      Click to choose CSV or Excel spreadsheet
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Supports .csv, .xlsx from LeadForge, Apollo, ZoomInfo, Bing Maps, or Google Maps
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING & FOLDER SELECTION */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Prospect Folder / Category:
                  </label>
                  <input
                    type="text"
                    value={targetCategoryFolder}
                    onChange={(e) => setTargetCategoryFolder(e.target.value)}
                    placeholder="e.g. Cafes & Coffee Shops, Medical Clinics, etc."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
                  <div className="text-[11px] font-bold text-slate-600 uppercase">Map Columns:</div>
                  {[
                    { key: "email", label: "Email Address *" },
                    { key: "name", label: "Business / Contact Name" },
                    { key: "phone", label: "Phone Number" },
                    { key: "website", label: "Website URL" },
                    { key: "city", label: "City" },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between text-xs gap-3">
                      <span className="text-slate-700 font-medium">{field.label}:</span>
                      <select
                        value={columnMapping[field.key] || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
                      >
                        <option value="">-- Select Column --</option>
                        {parsedHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="btn-secondary text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="btn-sky text-xs font-semibold"
                  >
                    {importing ? "Ingesting..." : `Import ${parsedRows.length} Leads`}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RESULT */}
            {wizardStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ingestion Complete!</h3>
                <p className="text-xs text-slate-500">
                  Successfully imported <strong>{importResult?.importedCount || 0}</strong> new prospect leads into &quot;{targetCategoryFolder}&quot;.
                </p>
                <button
                  onClick={() => setShowImportWizard(false)}
                  className="btn-primary text-xs py-2 px-6"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MANUAL ADD LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clean-card p-6 rounded-xl max-w-md w-full border border-slate-200 bg-white shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900">Add Single Prospect Lead</h2>

            <form onSubmit={handleAddManualLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Apex Health Clinic"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Folder</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Cafes & Coffee Shops"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1-555-0199"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-sky text-xs font-semibold"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
