import { useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128)
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: "Enter the email of the account to reset" }),
  masterPassword: z.string().min(1, { message: "Master password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" })
});


const AdminLogin = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // State for Login
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  
  // State for Forgot Password
  const [forgotForm, setForgotForm] = useState({ email: "", masterPassword: "", newPassword: "" });
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse(loginForm);
      const response = await fetch(`${API_BASE_URL}/api/admin/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');
      
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
      if (data.data && data.data.token) {
          localStorage.setItem('adminToken', data.data.token);
      }
      navigate('/admin/dashboard');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        setLoginErrors(error.issues.reduce((acc, issue) => ({...acc, [issue.path[0]]: issue.message }), {}));
      } else if (error instanceof Error) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } else {
         toast({ title: "Login Failed", description: "An unexpected error occurred.", variant: "destructive"});
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotErrors({});
      setIsLoading(true);

      try {
          const validatedData = forgotPasswordSchema.parse(forgotForm);
          const response = await fetch(`${API_BASE_URL}/api/admin/reset-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(validatedData)
          });
          const data = await response.json();

          if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');

          toast({ title: "Password Reset Successful", description: "You can now log in with the new password." });
          setIsForgotPassword(false); // Switch back to login view
          setForgotForm({ email: "", masterPassword: "", newPassword: "" }); // Clear form

      } catch (error) {
          if (error instanceof z.ZodError) {
              setForgotErrors(error.issues.reduce((acc, issue) => ({...acc, [issue.path[0]]: issue.message }), {}));
          } else if (error instanceof Error) {
              toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
          } else {
              toast({ title: "Reset Failed", description: "An unexpected error occurred.", variant: "destructive"});
          }
      } finally {
          setIsLoading(false);
      }
  };

  const handleLoginChange = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) setLoginErrors(prev => ({ ...prev, [field]: "" }));
  };
  
  const handleForgotChange = (field: string, value: string) => {
    setForgotForm(prev => ({ ...prev, [field]: value }));
    if (forgotErrors[field]) setForgotErrors(prev => ({ ...prev, [field]: "" }));
  };

  const renderLoginForm = () => (
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="admin@example.com" value={loginForm.email} onChange={(e) => handleLoginChange("email", e.target.value)} className={loginErrors.email ? "border-destructive" : ""} disabled={isLoading} />
          {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginForm.password} onChange={(e) => handleLoginChange("password", e.target.value)} className={loginErrors.password ? "border-destructive" : ""} disabled={isLoading} />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
        
        <div className="text-center">
            <Button variant="link" className="p-0 h-auto font-normal text-sm" onClick={() => setIsForgotPassword(true)}>
                Forgot Password?
            </Button>
        </div>
      </form>
  );

  const renderForgotPasswordForm = () => (
      <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="reset-email">Admin's Email</Label>
              <Input id="reset-email" type="email" placeholder="admin-to-reset@example.com" value={forgotForm.email} onChange={(e) => handleForgotChange("email", e.target.value)} className={forgotErrors.email ? "border-destructive" : ""} disabled={isLoading}/>
              {forgotErrors.email && <p className="text-sm text-destructive">{forgotErrors.email}</p>}
          </div>

          <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <Input id="master-password" type="password" placeholder="Enter the master password" value={forgotForm.masterPassword} onChange={(e) => handleForgotChange("masterPassword", e.target.value)} className={forgotErrors.masterPassword ? "border-destructive" : ""} disabled={isLoading}/>
              {forgotErrors.masterPassword && <p className="text-sm text-destructive">{forgotErrors.masterPassword}</p>}
          </div>

          <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Enter new password for the admin" value={forgotForm.newPassword} onChange={(e) => handleForgotChange("newPassword", e.target.value)} className={forgotErrors.newPassword ? "border-destructive" : ""} disabled={isLoading}/>
              {forgotErrors.newPassword && <p className="text-sm text-destructive">{forgotErrors.newPassword}</p>}
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2">Contact your organization for the master password.</p>

          <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <Button variant="link" className="p-0 h-auto font-normal text-sm" onClick={() => setIsForgotPassword(false)}>
                Back to Login
            </Button>
        </div>
      </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              {isForgotPassword ? <KeyRound className="h-8 w-8 text-primary" /> : <MapPin className="h-8 w-8 text-primary" />}
            </div>
            <CardTitle className="text-2xl">{isForgotPassword ? 'Reset Password' : 'Admin Login'}</CardTitle>
            <CardDescription>
              {isForgotPassword ? 'Reset an admin password using the master key.' : 'Sign in to your NaviGuide admin account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}

            {!isForgotPassword && (
                 <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Button variant="link" className="p-0 h-auto font-normal" onClick={() => navigate('/admin/signup')}>
                        Sign up here
                        </Button>
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
