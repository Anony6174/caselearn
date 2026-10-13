import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { TracksPage } from "./pages/TracksPage";
import { TrackPage } from "./pages/TrackPage";
import { ItemPage } from "./pages/ItemPage";

// Old links were /case/:id; all of those items are in the ML & stats track.
function LegacyCaseRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/t/ml-stats/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TracksPage />} />
      <Route path="/t/:track" element={<TrackPage />} />
      <Route path="/t/:track/:id" element={<ItemPage />} />
      <Route path="/case/:id" element={<LegacyCaseRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
