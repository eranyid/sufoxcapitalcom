import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Quant() {
  const location = useLocation();
  const navigate = useNavigate();

  // If user lands on /quant exactly, redirect to /quant/data
  useEffect(() => {
    if (location.pathname === '/quant') {
      navigate('/quant/data', { replace: true });
    }
  }, [location.pathname, navigate]);

  return <Outlet />;
}
