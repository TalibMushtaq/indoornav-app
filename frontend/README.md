# 🎨 NaviGuide Frontend

A modern, responsive React application built with TypeScript, providing an intuitive interface for indoor navigation and building management.

![Frontend Preview](https://placehold.co/800x400/1e40af/ffffff?text=NaviGuide+Frontend+-+Modern+UI+Components)

## ✨ Features

### 🧭 **Navigation Interface**
- **Interactive Route Planning** with visual building selection
- **Step-by-Step Navigation** with landmark images
- **Accessibility Preferences** for inclusive navigation
- **Real-time Route Calculation** with AI optimization
- **Mobile-First Design** for on-the-go navigation

### 🏢 **Admin Dashboard**
- **Comprehensive Management** for buildings, landmarks, and paths
- **Visual Data Tables** with sorting and filtering
- **Form Validation** with real-time feedback
- **Image Upload** with drag-and-drop interface
- **Analytics Dashboard** with usage statistics

### 🎨 **UI/UX Features**
- **Modern Design System** using shadcn/ui components
- **Dark/Light Mode** support (ready for implementation)
- **Responsive Layout** for all screen sizes
- **Smooth Animations** with Framer Motion
- **Accessibility** compliant with WCAG guidelines

## 🛠️ Tech Stack

### **Core Technologies**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router v6** for client-side routing
- **TanStack Query** for server state management

### **Styling & UI**
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible component library
- **Framer Motion** for smooth animations
- **Lucide React** for consistent icons

### **Development Tools**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Vite** for hot module replacement

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Backend API** running on port 5000

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**

   Create a `.env.local` file in the frontend directory:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5000
   
   # App Configuration
   VITE_APP_NAME=NaviGuide
   VITE_APP_VERSION=1.0.0
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:8080
   - **Admin Dashboard**: http://localhost:8080/admin/login

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/           # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Hero.tsx         # Landing page hero
│   │   ├── About.tsx        # About section
│   │   ├── Contact.tsx      # Contact form
│   │   ├── Footer.tsx       # Page footer
│   │   └── AdminLayout.tsx  # Admin dashboard layout
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Landing page
│   │   ├── Navigation.tsx   # Navigation interface
│   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   ├── AdminBuildings.tsx # Building management
│   │   ├── AdminLandmarks.tsx # Landmark management
│   │   ├── AdminPaths.tsx   # Path management
│   │   ├── AdminLogin.tsx   # Admin login
│   │   ├── AdminSignup.tsx  # Admin registration
│   │   ├── VisitorRegistration.tsx # Visitor registration
│   │   └── NotFound.tsx     # 404 page
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx   # Mobile detection hook
│   │   └── use-toast.ts     # Toast notification hook
│   ├── lib/                 # Utility libraries
│   │   └── api.ts           # API client functions
│   ├── utils/               # Utility functions
│   │   └── api.ts           # API helper functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── components.json           # shadcn/ui configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## 🎨 Component Architecture

### **UI Components (shadcn/ui)**
- **Button** - Interactive buttons with variants
- **Card** - Content containers with headers and content
- **Input** - Form input fields with validation
- **Select** - Dropdown selection components
- **Dialog** - Modal dialogs and overlays
- **Toast** - Notification system
- **Alert** - Alert messages and warnings

### **Custom Components**
- **Header** - Navigation header with mobile menu
- **AdminLayout** - Dashboard layout with sidebar
- **Hero** - Landing page hero section
- **About** - About section with features
- **Contact** - Contact form with validation

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types

# Build Analysis
npm run build:analyze # Analyze bundle size
```

## 🎯 Key Features Implementation

### **Navigation System**
```typescript
// Route calculation with preferences
const calculateRoute = async (from: string, to: string, preferences: NavigationPreferences) => {
  const response = await apiPost('/navigation/route', {
    building: selectedBuilding,
    from,
    to,
    preferences
  });
  return response.json();
};
```

### **Admin Management**
```typescript
// Building management with image upload
const createBuilding = async (buildingData: BuildingFormData) => {
  const formData = new FormData();
  formData.append('name', buildingData.name);
  formData.append('image', buildingData.image);
  
  const response = await apiCallWithAuth('/admin/buildings', token, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

### **State Management**
```typescript
// Using TanStack Query for server state
const { data: buildings, isLoading } = useQuery({
  queryKey: ['buildings'],
  queryFn: () => fetchBuildings(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## 🎨 Styling Guidelines

### **Tailwind CSS Classes**
```css
/* Component styling with Tailwind */
.navigation-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.button-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors;
}
```

### **CSS Variables**
```css
/* Custom CSS variables for theming */
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### **Mobile-First Approach**
```typescript
// Responsive component with mobile-first design
const NavigationCard = () => (
  <div className="w-full md:w-1/2 lg:w-1/3 p-4">
    <Card className="h-full">
      {/* Card content */}
    </Card>
  </div>
);
```

## 🔒 Security Considerations

### **Input Validation**
- **Client-side validation** with Zod schemas
- **Sanitization** of user inputs
- **XSS protection** with proper escaping

### **Authentication**
- **JWT token management** with secure storage
- **Automatic token refresh** on expiration
- **Protected routes** with authentication guards

## 🚀 Performance Optimization

### **Code Splitting**
```typescript
// Lazy loading for better performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Navigation = lazy(() => import('./pages/Navigation'));
```

### **Image Optimization**
```typescript
// Optimized image loading
const ImageComponent = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className="w-full h-auto object-cover"
  />
);
```

## 🧪 Testing

### **Testing Setup**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

### **Test Examples**
```typescript
// Component testing
import { render, screen } from '@testing-library/react';
import { Navigation } from './Navigation';

test('renders navigation form', () => {
  render(<Navigation />);
  expect(screen.getByText('Find Your Way')).toBeInTheDocument();
});
```

## 🚀 Deployment

### **Vercel Deployment**
1. **Connect Repository** to Vercel
2. **Set Environment Variables**:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_APP_NAME`: Application name
3. **Deploy** automatically on push

### **Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true
  }
});
```

## 🔧 Development Guidelines

### **Code Style**
- Use **TypeScript** for all components
- Follow **React best practices**
- Use **functional components** with hooks
- Implement **proper error handling**

### **Component Structure**
```typescript
// Standard component structure
interface ComponentProps {
  title: string;
  onAction: () => void;
}

const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    onAction();
  };
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};
```

## 🐛 Troubleshooting

### **Common Issues**

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npm run type-check
```

**Styling Issues**
```bash
# Rebuild Tailwind CSS
npm run build
```

## 📚 Resources

- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Vite Guide**: https://vitejs.dev/guide/

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ using React, TypeScript, and Tailwind CSS</p>
  <p>Part of the NaviGuide Indoor Navigation System</p>
</div>