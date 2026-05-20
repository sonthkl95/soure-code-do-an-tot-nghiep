import { Outlet } from "react-router";
import Sidebar from "./Layout/Sidebar/Sidebar";
import Topbar from "./Layout/Topbar/Topbar";

export default function App() {
  return (
   <div className="app-shell">
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Topbar />
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
