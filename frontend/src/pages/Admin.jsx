import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import {
    Upload,
    Image as ImageIcon,
    FileText,
    LogOut,
    Trash2,
    Star,
    StarOff,
    X,
    Check,
    Loader2,
} from "lucide-react";
import { BUSINESS } from "@/lib/constants";
import {
    adminLogin,
    adminVerify,
    adminListPhotos,
    uploadPhotos,
    updatePhoto,
    deletePhoto,
    absoluteUrl,
} from "@/lib/api";

const TOKEN_KEY = "abf_admin_token";

export default function Admin() {
    const [authState, setAuthState] = useState("checking"); // checking | loggedOut | loggedIn

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setAuthState("loggedOut");
            return;
        }
        adminVerify()
            .then(() => setAuthState("loggedIn"))
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                setAuthState("loggedOut");
            });
    }, []);

    if (authState === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (authState === "loggedOut") {
        return <LoginScreen onSuccess={() => setAuthState("loggedIn")} />;
    }

    return <AdminShell onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthState("loggedOut");
    }} />;
}

// =============== Login Screen ===============
function LoginScreen({ onSuccess }) {
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!password) return;
        setSubmitting(true);
        try {
            const { access_token } = await adminLogin(password);
            localStorage.setItem(TOKEN_KEY, access_token);
            onSuccess();
        } catch (err) {
            const msg = err?.response?.data?.detail || "Login failed";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-5">
            <form
                onSubmit={handleLogin}
                className="p-8 bg-white shadow-2xl rounded-2xl space-y-5 w-full max-w-sm"
                data-testid="admin-login-form"
            >
                <div className="text-center">
                    <img src={BUSINESS.logo} alt="Logo" className="h-12 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
                    <p className="text-sm text-slate-500 mt-1">All Best Fencing — staff only</p>
                </div>
                <input
                    type="password"
                    placeholder="Password"
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="admin-login-password"
                />
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-bold py-3 rounded-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                    data-testid="admin-login-submit"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Signing in…" : "Sign In"}
                </button>
            </form>
        </div>
    );
}

// =============== Admin Shell ===============
function AdminShell({ onLogout }) {
    const [tab, setTab] = useState("photos"); // photos | documents

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={BUSINESS.logo} alt="Logo" className="h-8" />
                        <div>
                            <div className="text-xs uppercase tracking-widest text-slate-400">Admin</div>
                            <div className="font-bold text-slate-900 leading-tight">All Best Fencing</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <TabBtn icon={<ImageIcon className="w-4 h-4" />} label="Photos" active={tab === "photos"} onClick={() => setTab("photos")} />
                        <TabBtn icon={<FileText className="w-4 h-4" />} label="Documents" active={tab === "documents"} onClick={() => setTab("documents")} />
                        <button
                            onClick={onLogout}
                            className="ml-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 inline-flex items-center gap-1.5"
                            data-testid="admin-logout"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {tab === "photos" ? <PhotoManager /> : <DocumentGenerator />}
        </div>
    );
}

function TabBtn({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                active ? "bg-orange-100 text-orange-700" : "text-slate-600 hover:bg-slate-100"
            }`}
            data-testid={`admin-tab-${label.toLowerCase()}`}
        >
            {icon} {label}
        </button>
    );
}

// =============== Photo Manager ===============
function PhotoManager() {
    const [photos, setPhotos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [serviceKeys, setServiceKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    // upload state
    const [pendingFiles, setPendingFiles] = useState([]);
    const [uploadCategory, setUploadCategory] = useState("Wood Fence");
    const [uploadCaption, setUploadCaption] = useState("");
    const [uploadFeatured, setUploadFeatured] = useState(false);
    const [uploadServiceHero, setUploadServiceHero] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminListPhotos();
            setPhotos(data.photos || []);
            setCategories(data.categories || []);
            setServiceKeys(data.service_keys || []);
        } catch (err) {
            toast.error("Failed to load photos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const onPickFiles = (filesList) => {
        const arr = Array.from(filesList || []);
        const valid = arr.filter((f) => /^image\//.test(f.type) && f.size <= 12 * 1024 * 1024);
        const skipped = arr.length - valid.length;
        if (skipped > 0) toast.warning(`${skipped} file(s) skipped (not an image or > 12 MB)`);
        if (valid.length === 0) return;
        setPendingFiles((prev) => [...prev, ...valid]);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        onPickFiles(e.dataTransfer.files);
    };

    const removePending = (idx) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const doUpload = async () => {
        if (pendingFiles.length === 0) {
            toast.error("Add at least one photo");
            return;
        }
        setUploading(true);
        setUploadProgress(0);
        try {
            await uploadPhotos({
                files: pendingFiles,
                category: uploadCategory,
                caption: uploadCaption,
                featured: uploadFeatured,
                showOnHomepage: true,
                serviceHeroFor: uploadServiceHero || null,
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                },
            });
            toast.success(`Uploaded ${pendingFiles.length} photo(s) — they're live on the website now.`);
            setPendingFiles([]);
            setUploadCaption("");
            setUploadServiceHero("");
            setUploadFeatured(false);
            await refresh();
        } catch (err) {
            const msg = err?.response?.data?.detail || "Upload failed";
            toast.error(typeof msg === "string" ? msg : "Upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const filtered = filter === "All" ? photos : photos.filter((p) => p.category === filter);

    return (
        <div className="max-w-7xl mx-auto px-5 py-8 space-y-8">
            {/* Upload Card */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Upload Photos</h2>
                        <p className="text-sm text-slate-500 mt-1">JPG, PNG, WebP, HEIC — up to 12 MB each. Auto‑optimised for the web.</p>
                    </div>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors p-10 text-center ${
                        dragOver ? "border-orange-400 bg-orange-50" : "border-slate-300 hover:border-orange-300 hover:bg-orange-50/30"
                    }`}
                    data-testid="dropzone"
                >
                    <Upload className="w-10 h-10 mx-auto text-slate-400" />
                    <div className="mt-3 font-semibold text-slate-700">Drop photos here or click to browse</div>
                    <div className="text-xs text-slate-400 mt-1">You can select multiple at once</div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onPickFiles(e.target.files)}
                        data-testid="file-input"
                    />
                </div>

                {pendingFiles.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {pendingFiles.map((f, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removePending(i); }}
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded truncate">
                                        {f.name}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Category</label>
                                <select
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    data-testid="upload-category"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Caption (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cedar fence — Burnaby, 2024"
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    data-testid="upload-caption"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Set as service hero (optional)</label>
                                <select
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    value={uploadServiceHero}
                                    onChange={(e) => setUploadServiceHero(e.target.value)}
                                    data-testid="upload-service-hero"
                                >
                                    <option value="">— none —</option>
                                    {serviceKeys.map((k) => (
                                        <option key={k} value={k}>{serviceKeyLabel(k)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={uploadFeatured}
                                        onChange={(e) => setUploadFeatured(e.target.checked)}
                                        className="w-4 h-4 accent-orange-500"
                                    />
                                    Mark as Featured (pin to top)
                                </label>
                            </div>
                        </div>

                        {uploading && (
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-orange-500 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={doUpload}
                                disabled={uploading}
                                className="bg-gradient-to-r from-[#ff7a00] to-[#d97706] text-white font-bold px-5 py-2.5 rounded-lg disabled:opacity-60 inline-flex items-center gap-2"
                                data-testid="upload-submit"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? `Uploading… ${uploadProgress}%` : `Upload ${pendingFiles.length} photo(s)`}
                            </button>
                            <button
                                onClick={() => setPendingFiles([])}
                                disabled={uploading}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Gallery */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">All Photos</h2>
                        <p className="text-sm text-slate-500 mt-1">{photos.length} total · {filtered.length} shown</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {["All", ...categories].map((c) => (
                            <button
                                key={c}
                                onClick={() => setFilter(c)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    filter === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                                data-testid={`filter-${c.replace(/[^a-z0-9]/gi, "-")}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                        No photos in this category yet — upload some above!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map((p) => (
                            <PhotoCard key={p.id} photo={p} categories={categories} serviceKeys={serviceKeys} onChanged={refresh} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function serviceKeyLabel(k) {
    const map = {
        wood: "Luxury Wood Fencing",
        metal: "Metal Fencing",
        privacy: "Privacy & Security",
        gates: "Custom Gates & Automation",
        chainlink: "Chain Link Fences",
        vinyl: "Vinyl Fencing",
        glass: "Glass Railings",
    };
    return map[k] || k;
}

function PhotoCard({ photo, categories, serviceKeys, onChanged }) {
    const [editing, setEditing] = useState(false);
    const [caption, setCaption] = useState(photo.caption || "");
    const [category, setCategory] = useState(photo.category);
    const [serviceHero, setServiceHero] = useState(photo.service_hero_for || "");
    const [busy, setBusy] = useState(false);

    const save = async () => {
        setBusy(true);
        try {
            await updatePhoto(photo.id, { caption, category, service_hero_for: serviceHero || null });
            toast.success("Updated");
            setEditing(false);
            onChanged();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Update failed");
        } finally { setBusy(false); }
    };

    const toggleFeatured = async () => {
        setBusy(true);
        try {
            await updatePhoto(photo.id, { featured: !photo.featured });
            onChanged();
        } catch { toast.error("Failed"); }
        finally { setBusy(false); }
    };

    const toggleHomepage = async () => {
        setBusy(true);
        try {
            await updatePhoto(photo.id, { show_on_homepage: !photo.show_on_homepage });
            onChanged();
        } catch { toast.error("Failed"); }
        finally { setBusy(false); }
    };

    const doDelete = async () => {
        if (!window.confirm("Delete this photo? This cannot be undone.")) return;
        setBusy(true);
        try {
            await deletePhoto(photo.id);
            toast.success("Deleted");
            onChanged();
        } catch { toast.error("Delete failed"); }
        finally { setBusy(false); }
    };

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-[4/3] bg-slate-100">
                <img src={absoluteUrl(photo.url)} alt={photo.caption || ""} className="w-full h-full object-cover" />
                {photo.featured && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> FEATURED
                    </div>
                )}
                {photo.service_hero_for && (
                    <div className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        Service: {serviceKeyLabel(photo.service_hero_for)}
                    </div>
                )}
                {!photo.show_on_homepage && (
                    <div className="absolute bottom-2 left-2 bg-slate-700/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        Hidden from homepage
                    </div>
                )}
            </div>
            <div className="p-3 space-y-2">
                {editing ? (
                    <>
                        <input
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Caption"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm">
                            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                        <select value={serviceHero} onChange={(e) => setServiceHero(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm">
                            <option value="">— No service hero —</option>
                            {serviceKeys.map((k) => (<option key={k} value={k}>{serviceKeyLabel(k)}</option>))}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={save} disabled={busy} className="flex-1 bg-orange-500 text-white text-xs font-bold py-1.5 rounded inline-flex items-center justify-center gap-1">
                                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                            </button>
                            <button onClick={() => setEditing(false)} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-1.5 rounded">Cancel</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-xs text-slate-500 truncate">{photo.caption || <span className="italic text-slate-300">No caption</span>}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{photo.category}</div>
                        <div className="flex gap-1 pt-1">
                            <button onClick={() => setEditing(true)} className="flex-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded py-1.5">Edit</button>
                            <button onClick={toggleFeatured} disabled={busy} title={photo.featured ? "Unfeature" : "Feature"} className="px-2 py-1.5 text-orange-500 hover:bg-orange-50 rounded">
                                {photo.featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={toggleHomepage} disabled={busy} title={photo.show_on_homepage ? "Hide from homepage" : "Show on homepage"} className="px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold">
                                {photo.show_on_homepage ? "👁" : "🚫"}
                            </button>
                            <button onClick={doDelete} disabled={busy} className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// =============== Document Generator (preserved) ===============
function DocumentGenerator() {
    const [docType, setDocType] = useState("INVOICE");
    const [billToName, setBillToName] = useState("");
    const [billToAddress, setBillToAddress] = useState("");
    const [items, setItems] = useState([{ desc: "", qty: 1, rate: 0 }]);
    const [isSending, setIsSending] = useState(false);
    const invoiceRef = useRef(null);

    const handleAddItem = () => setItems([...items, { desc: "", qty: 1, rate: 0 }]);
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };
    const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));

    const subtotal = items.reduce((acc, item) => acc + item.qty * item.rate, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const downloadPDF = async () => {
        setIsSending(true);
        try {
            const element = invoiceRef.current;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            const fileName = `${docType}_${billToName.replace(/\s+/g, "_") || "Client"}.pdf`;
            pdf.save(fileName);
            toast.success(`${docType} downloaded successfully!`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF.");
        } finally {
            setIsSending(false);
        }
    };

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit space-y-6">
                <h2 className="text-xl font-bold">Document Generator</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select className="w-full p-2 border rounded" value={docType} onChange={(e) => setDocType(e.target.value)}>
                            <option value="INVOICE">Invoice</option>
                            <option value="QUOTE">Quote</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bill To: Name</label>
                        <input type="text" className="w-full p-2 border rounded" value={billToName} onChange={(e) => setBillToName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bill To: Address</label>
                        <textarea className="w-full p-2 border rounded" value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} rows={3} />
                    </div>
                    <div className="pt-4 border-t">
                        <h3 className="font-bold mb-2">Items</h3>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input className="w-1/2 p-2 border rounded text-sm" placeholder="Description" value={item.desc} onChange={(e) => handleItemChange(index, "desc", e.target.value)} />
                                <input type="number" className="w-1/6 p-2 border rounded text-sm" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))} />
                                <input type="number" className="w-1/4 p-2 border rounded text-sm" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, "rate", Number(e.target.value))} />
                                <button onClick={() => handleRemoveItem(index)} className="text-red-500 font-bold px-2">×</button>
                            </div>
                        ))}
                        <button onClick={handleAddItem} className="text-blue-600 text-sm mt-2 font-medium">+ Add Item</button>
                    </div>
                </div>
                <button onClick={downloadPDF} disabled={isSending} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
                    {isSending ? "Generating…" : `Download ${docType}`}
                </button>
            </div>

            <div className="w-full md:w-2/3 overflow-auto flex justify-center">
                <div ref={invoiceRef} className="bg-white p-12 shadow-md w-[800px] h-[1131px] shrink-0 text-black font-sans relative">
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <img src={BUSINESS.logo} alt="Logo" className="h-16" />
                            </div>
                            <div className="text-gray-600 text-sm leading-relaxed">
                                <strong className="text-gray-900">{BUSINESS.name}</strong><br />
                                {BUSINESS.phoneDisplay}<br />
                                {BUSINESS.email}<br />
                                BC, Canada
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-light text-gray-800 tracking-wide mb-2">{docType}</h1>
                            <p className="text-gray-500 text-sm mb-6"># ABF-{Math.floor(1000 + Math.random() * 9000)}</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 text-left">
                                <span>Date:</span><span className="text-right text-gray-900">{today}</span>
                                <span>Due Date:</span><span className="text-right text-gray-900">{dueDate}</span>
                            </div>
                            <div className="mt-6 bg-gray-50 p-4 rounded flex justify-between items-center w-64 ml-auto border">
                                <span className="font-bold text-gray-700">Total Due:</span>
                                <span className="font-bold text-xl text-gray-900">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mb-12">
                        <h3 className="text-gray-500 text-sm mb-2">Bill To:</h3>
                        <div className="text-gray-800">
                            <strong>{billToName || "Client Name"}</strong>
                            <p className="whitespace-pre-wrap mt-1 text-sm">{billToAddress || "Client Address"}</p>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white text-sm">
                                <th className="p-3 font-semibold rounded-tl-sm">Item</th>
                                <th className="p-3 font-semibold w-24 text-right">Quantity</th>
                                <th className="p-3 font-semibold w-32 text-right">Rate</th>
                                <th className="p-3 font-semibold w-32 text-right rounded-tr-sm">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="p-3 text-sm">{item.desc || "Item Description"}</td>
                                    <td className="p-3 text-sm text-right">{item.qty}</td>
                                    <td className="p-3 text-sm text-right">${item.rate.toFixed(2)}</td>
                                    <td className="p-3 text-sm text-right">${(item.qty * item.rate).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-8">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-gray-600 text-sm"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600 text-sm"><span>Tax (5%):</span><span>${tax.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
