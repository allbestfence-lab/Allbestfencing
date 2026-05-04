import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <div className="App min-h-screen bg-abf-bg text-white">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
        </div>
    );
}

export default App;
