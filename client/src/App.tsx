import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: 32 }}><h1>拼音学习 🎉</h1></div>} />
    </Routes>
  );
}
