import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { BUSINESS } from "@/lib/constants";

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple hardcoded auth for demo purposes
        if (password === "admin123") {
            setIsLoggedIn(true);
        } else {
            toast.error("Incorrect password");
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <form onSubmit={handleLogin} className="p-8 bg-white shadow-lg rounded-xl space-y-4">
                    <h2 className="text-2xl font-bold text-center">Admin Login</h2>
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 border rounded-md"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return <AdminDashboard />;
}

function AdminDashboard() {
    const [docType, setDocType] = useState("INVOICE");
    const [clientEmail, setClientEmail] = useState("");
    const [billToName, setBillToName] = useState("");
    const [billToAddress, setBillToAddress] = useState("");
    
    const [items, setItems] = useState([{ desc: "", qty: 1, rate: 0 }]);
    const [isSending, setIsSending] = useState(false);
    
    const invoiceRef = useRef(null);

    const handleAddItem = () => {
        setItems([...items, { desc: "", qty: 1, rate: 0 }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
    const tax = subtotal * 0.05; // 5% GST example
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
            
            const fileName = `${docType}_${billToName.replace(/\s+/g, '_') || 'Client'}.pdf`;
            pdf.save(fileName);
            toast.success(`${docType} downloaded successfully!`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF. Check the console.");
        } finally {
            setIsSending(false);
        }
    };

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col md:flex-row gap-8">
            {/* Editor Sidebar */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-lg h-fit space-y-6">
                <h2 className="text-2xl font-bold">Document Generator</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select 
                            className="w-full p-2 border rounded"
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                        >
                            <option value="INVOICE">Invoice</option>
                            <option value="QUOTE">Quote</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bill To: Name</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded" 
                            value={billToName}
                            onChange={(e) => setBillToName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bill To: Address</label>
                        <textarea 
                            className="w-full p-2 border rounded" 
                            value={billToAddress}
                            onChange={(e) => setBillToAddress(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-bold mb-2">Items</h3>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input 
                                    className="w-1/2 p-2 border rounded text-sm" 
                                    placeholder="Description"
                                    value={item.desc}
                                    onChange={(e) => handleItemChange(index, "desc", e.target.value)}
                                />
                                <input 
                                    type="number"
                                    className="w-1/6 p-2 border rounded text-sm" 
                                    placeholder="Qty"
                                    value={item.qty}
                                    onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                                />
                                <input 
                                    type="number"
                                    className="w-1/4 p-2 border rounded text-sm" 
                                    placeholder="Rate"
                                    value={item.rate}
                                    onChange={(e) => handleItemChange(index, "rate", Number(e.target.value))}
                                />
                                <button 
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-500 font-bold px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button onClick={handleAddItem} className="text-blue-600 text-sm mt-2 font-medium">
                            + Add Item
                        </button>
                    </div>
                </div>

                <button 
                    onClick={downloadPDF}
                    disabled={isSending}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                    {isSending ? "Generating..." : `Download ${docType}`}
                </button>
            </div>

            {/* A4 Preview Container */}
            <div className="w-full md:w-2/3 overflow-auto flex justify-center">
                <div 
                    ref={invoiceRef}
                    className="bg-white p-12 shadow-md w-[800px] h-[1131px] shrink-0 text-black font-sans relative"
                >
                    {/* Header */}
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
                                <span>Date:</span>
                                <span className="text-right text-gray-900">{today}</span>
                                <span>Due Date:</span>
                                <span className="text-right text-gray-900">{dueDate}</span>
                            </div>
                            
                            <div className="mt-6 bg-gray-50 p-4 rounded flex justify-between items-center w-64 ml-auto border">
                                <span className="font-bold text-gray-700">Total Due:</span>
                                <span className="font-bold text-xl text-gray-900">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-12">
                        <h3 className="text-gray-500 text-sm mb-2">Bill To:</h3>
                        <div className="text-gray-800">
                            <strong>{billToName || "Client Name"}</strong>
                            <p className="whitespace-pre-wrap mt-1 text-sm">{billToAddress || "Client Address"}</p>
                        </div>
                    </div>

                    {/* Table */}
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

                    {/* Totals */}
                    <div className="flex justify-end mt-8">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Tax (5%):</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
