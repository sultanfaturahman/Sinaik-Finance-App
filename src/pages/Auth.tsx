import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, X } from 'lucide-react';

const emailSchema = z.string().email('Email tidak valid');
const passwordSchema = z.string().min(6, 'Password minimal 6 karakter');
const nameSchema = z.string().min(2, 'Nama minimal 2 karakter');

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Check if user should see PWA banner (mobile + not in PWA + came from email)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as { standalone?: boolean }).standalone === true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const searchParams = new URLSearchParams(location.search);
    const isFromEmail = searchParams.get('verified') === '1' || location.hash.includes('type=signup');
    
    if (isMobile && !isStandalone && isFromEmail) {
      setShowPwaBanner(true);
    }
  }, [location]);

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Login berhasil!');
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(registerName);
      emailSchema.parse(registerEmail);
      passwordSchema.parse(registerPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: {
          name: registerName,
        },
        emailRedirectTo: `${window.location.origin}/auth?verified=1`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoginNotice(`Kami telah mengirim tautan konfirmasi ke ${registerEmail}. Silakan buka email tersebut lalu verifikasi untuk melanjutkan.`);
    setActiveTab('login');
    setLoading(false);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('verified') === '1') {
      setLoginNotice('Email Anda berhasil dikonfirmasi. Silakan masuk dengan kredensial yang telah dibuat.');
      setActiveTab('login');
    }

    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.replace('#', ''));
      const type = hashParams.get('type');
      if (type === 'signup') {
        setLoginNotice('Email Anda berhasil dikonfirmasi. Silakan masuk dengan kredensial yang telah dibuat.');
        setActiveTab('login');
        window.history.replaceState({}, '', location.pathname + location.search);
      }
    }
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* PWA Install Banner for mobile users coming from email */}
      {showPwaBanner && (
        <div className="mb-4 w-full max-w-sm animate-in slide-in-from-top-2">
          <Alert className="relative border-primary/50 bg-primary/10">
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="pr-6 text-sm">
              <strong>Sudah install aplikasi SiNaik?</strong>
              <br />
              Buka aplikasi SiNaik di layar utama HP Anda untuk pengalaman terbaik.
            </AlertDescription>
            <button
              onClick={() => setShowPwaBanner(false)}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-primary/10"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </Alert>
        </div>
      )}
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-3">
          <img src="/pwa-192x192.png" alt="SiNaik" className="mx-auto h-20 w-20 object-contain" />
          <CardDescription className="text-sm">
            Bersama Naik Kelas, UMKM Tumbuh Berkualitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginNotice && (
                  <Alert className="border-primary/30 bg-primary/5 text-sm">
                    <AlertDescription>{loginNotice}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nama Lengkap</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Nama Anda"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Daftar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
