

import { useState } from "react";
import { Link } from "react-router-dom"; // Use Link for better navigation
import { Menu, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator"; // Import Separator

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    // Only scroll if on the homepage
    if (window.location.pathname === "/") {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      // If on another page, navigate to homepage first
      window.location.href = `/${href}`;
    }
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <MapPin className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">NaviGuide</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost">
              <Link to="/admin/login">Admin Login</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/signup">Admin Sign Up</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[400px]">
            <div className="flex flex-col space-y-6 mt-6">
              {/* Navigation Links */}
              <div className="space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="block text-left text-lg text-foreground hover:text-primary transition-colors w-full"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              
              {/* Admin Section */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Admin Access</h3>
                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/login" onClick={() => setIsOpen(false)}>
                      Admin Login
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="w-full justify-start">
                    <Link to="/admin/signup" onClick={() => setIsOpen(false)}>
                      Admin Sign Up
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default Header;