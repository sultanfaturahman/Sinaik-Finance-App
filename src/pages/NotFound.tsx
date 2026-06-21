import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-primary">404</h1>
        <p className="text-lg text-muted-foreground">Halaman tidak ditemukan</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          URL yang Anda akses tidak tersedia. Pastikan alamat sudah benar atau kembali ke Dashboard.
        </p>
        <Button asChild variant="default" className="mt-2 rounded-xl">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
