import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark-500 flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 page-enter">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
