import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { Toaster } from "@/components/ui/sonner";

import Admin from "@/pages/Admin";

function App() {
    return (
        <div className="App min-h-screen bg-abf-bg text-abf-ink">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
        </div>
    );
}

export default App;
