import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-8xl font-display font-bold text-primary/20 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Pagina non trovata</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Torna alla Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
