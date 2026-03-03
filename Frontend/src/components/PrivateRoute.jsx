import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <Loader />;
  if (!token) return <Navigate to="/" replace />;

  // If specific roles required, check them
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;