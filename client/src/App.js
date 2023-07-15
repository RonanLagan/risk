import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Join from "./pages/Join";
import Create from "./pages/Create";
import Game from "./pages/Game";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing/>}/>
        <Route path="/create" element={<Create/>}/>
        <Route path="/join" element={<Join/>}/>
        <Route path="/game" element={<Game/>}/>
      </Routes>
    </BrowserRouter>
  )
}
