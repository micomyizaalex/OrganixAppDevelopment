# Organix Healthcare Design System - Quick Reference Guide

## 🎨 Color Reference

### Primary Colors
```css
/* Primary Blue - Trust & Professionalism */
--primary: #0077B6
--primary-hover: #005f8f
--primary-light: #e6f4f9

/* Success Green - Positive Outcomes */
--secondary: #27AE60
--secondary-hover: #1f8c4d
--secondary-light: #e8f5ed

/* Alert Red - Urgency (Use Sparingly) */
--destructive: #E63946
--destructive-light: #fdebed

/* Accent Blue - Interactive States */
--accent: #4A9FCC
```

### Neutral Colors
```css
/* Backgrounds */
--background: #FFFFFF
--muted: #F5F7FA

/* Text */
--foreground: #2B2D42 (Dark Gray)
--muted-foreground: #6B7280 (Medium Gray)

/* Borders */
--border: #E5E7EB
```

## 📝 Typography Usage

### Headings (Montserrat Bold)
```tsx
<h1 style={{ fontFamily: 'var(--font-heading)' }}>
  Main Dashboard Title
</h1>

<h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
  Section Header
</h2>
```

### Body Text (Inter Regular)
```tsx
<p style={{ fontFamily: 'var(--font-body)' }}>
  Regular body text for descriptions and content
</p>

<label className="font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
  Form Label
</label>
```

### Buttons (Montserrat Semibold)
```tsx
<Button className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
  Primary Action
</Button>
```

## 🎯 Component Usage

### Status Badges
```tsx
/* Waiting Status */
<div className="status-waiting">
  <Clock className="h-4 w-4" />
  Waiting
</div>

/* Active/Success Status */
<div className="status-active">
  <CheckCircle className="h-4 w-4" />
  Active
</div>

/* Urgent Status */
<div className="status-urgent">
  <AlertCircle className="h-4 w-4" />
  Urgent
</div>

/* Completed Status */
<div className="status-completed">
  <Check className="h-4 w-4" />
  Completed
</div>
```

### Alert Banners
```tsx
/* Info Alert */
<div className="alert-info">
  <Info className="h-5 w-5" />
  <div>
    <p className="font-semibold">Information</p>
    <p className="text-sm">Your message here</p>
  </div>
</div>

/* Success Alert */
<div className="alert-success">
  <CheckCircle className="h-5 w-5" />
  <div>
    <p className="font-semibold">Success!</p>
    <p className="text-sm">Operation completed successfully</p>
  </div>
</div>

/* Warning Alert */
<div className="alert-warning">
  <AlertTriangle className="h-5 w-5" />
  <div>
    <p className="font-semibold">Warning</p>
    <p className="text-sm">Please review this information</p>
  </div>
</div>

/* Error Alert */
<div className="alert-error">
  <AlertCircle className="h-5 w-5" />
  <div>
    <p className="font-semibold">Error</p>
    <p className="text-sm">Something went wrong</p>
  </div>
</div>
```

### Buttons
```tsx
/* Primary Button */
<Button className="btn-primary">
  Primary Action
</Button>

/* Success Button */
<Button className="btn-success">
  Confirm
</Button>

/* With Icon */
<Button className="btn-primary">
  <CheckCircle className="w-5 h-5 mr-2" />
  Save Changes
</Button>

/* Loading State */
<Button disabled className="btn-primary">
  <div className="loading-spinner w-5 h-5 border-2 mr-2"></div>
  Loading...
</Button>
```

### Form Inputs
```tsx
/* Text Input with Icon */
<div className="space-y-2">
  <Label className="flex items-center gap-2 text-[#2B2D42] font-semibold">
    <User className="h-4 w-4 text-[#0077B6]" />
    Full Name
  </Label>
  <Input
    type="text"
    placeholder="Enter your name"
    className="border-2 border-[#E5E7EB] focus:border-[#0077B6]"
    style={{ fontFamily: 'var(--font-body)' }}
  />
</div>

/* Input with Validation Error */
<div className="space-y-2">
  <Label className="text-[#2B2D42] font-semibold">Email</Label>
  <Input
    type="email"
    className="border-2 border-[#E63946] bg-[#fdebed]"
  />
  <p className="text-sm text-[#E63946] flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    Please enter a valid email
  </p>
</div>
```

### Cards
```tsx
/* Standard Card */
<Card className="shadow-healthcare border-[#E5E7EB]">
  <CardHeader>
    <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
      Card Title
    </CardTitle>
    <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
      Card description
    </CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>

/* Interactive Card with Hover */
<Card className="shadow-healthcare border-[#E5E7EB] card-hover cursor-pointer">
  <CardContent>
    Clickable card content
  </CardContent>
</Card>

/* Card with Gradient Header */
<Card className="shadow-healthcare-lg border-[#E5E7EB]">
  <CardHeader className="bg-gradient-to-r from-[#0077B6] to-[#4A9FCC] text-white">
    <CardTitle className="flex items-center gap-3">
      <Heart className="h-6 w-6" />
      Feature Title
    </CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    Content here
  </CardContent>
</Card>
```

### Section Headers
```tsx
/* Blue Section (Personal Info) */
<div className="flex items-center gap-3 pb-3 border-b-2 border-[#0077B6]">
  <div className="w-8 h-8 bg-[#e6f4f9] rounded-lg flex items-center justify-center">
    <User className="h-5 w-5 text-[#0077B6]" />
  </div>
  <h3 className="text-lg font-bold text-[#2B2D42]" 
      style={{ fontFamily: 'var(--font-heading)' }}>
    Personal Information
  </h3>
</div>

/* Green Section (Contact Info) */
<div className="flex items-center gap-3 pb-3 border-b-2 border-[#27AE60]">
  <div className="w-8 h-8 bg-[#e8f5ed] rounded-lg flex items-center justify-center">
    <Phone className="h-5 w-5 text-[#27AE60]" />
  </div>
  <h3 className="text-lg font-bold text-[#2B2D42]"
      style={{ fontFamily: 'var(--font-heading)' }}>
    Contact Information
  </h3>
</div>

/* Blue Accent Section (Identification) */
<div className="flex items-center gap-3 pb-3 border-b-2 border-[#4A9FCC]">
  <div className="w-8 h-8 bg-[#e6f4f9] rounded-lg flex items-center justify-center">
    <Shield className="h-5 w-5 text-[#4A9FCC]" />
  </div>
  <h3 className="text-lg font-bold text-[#2B2D42]"
      style={{ fontFamily: 'var(--font-heading)' }}>
    Security & Privacy
  </h3>
</div>
```

## 🎭 Animation Classes

### Transitions
```tsx
/* Smooth color transition (applied globally) */
className="transition-colors"

/* Card hover effect */
className="card-hover"

/* Button with lift effect */
className="btn-primary" // includes hover lift
```

### Loading States
```tsx
/* Spinner */
<div className="loading-spinner w-8 h-8"></div>

/* Pulse animation */
<div className="animate-pulse">Loading content...</div>

/* Fade in animation */
<div className="fade-in">New content</div>
```

## 📐 Spacing Guidelines

### Padding
```tsx
/* Card padding */
className="p-6 sm:p-8"

/* Section spacing */
className="space-y-8"

/* Form field spacing */
className="space-y-5"
```

### Margins
```tsx
/* Section margins */
className="mb-8"

/* Between elements */
className="gap-3 sm:gap-4"
```

## 🎨 Color Application by Role

### Patient Features
```tsx
/* Primary Blue */
className="bg-[#0077B6] text-white"
className="text-[#0077B6]"
className="border-[#0077B6]"
```

### Donor Features
```tsx
/* Success Green */
className="bg-[#27AE60] text-white"
className="text-[#27AE60]"
className="border-[#27AE60]"
```

### Sponsor Features
```tsx
/* Warning Orange */
className="bg-[#F39C12] text-white"
className="text-[#F39C12]"
```

### Admin Features
```tsx
/* Dark Gray */
className="bg-[#2B2D42] text-white"
```

## 🔍 Accessibility Patterns

### Focus States
```tsx
/* All interactive elements get focus indicator automatically */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Keyboard Navigation
```tsx
/* Use semantic HTML */
<button>...</button>
<a href="...">...</a>

/* Add aria labels where needed */
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

### Screen Reader Support
```tsx
/* Use semantic headings */
<h1>Main Title</h1>
<h2>Section Title</h2>

/* Label all form inputs */
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />

/* Add descriptions for complex interactions */
<div role="alert">Error message</div>
```

## 📱 Responsive Patterns

### Mobile-First Approach
```tsx
/* Base: Mobile */
className="px-4 py-2"

/* Tablet */
className="sm:px-6 sm:py-3"

/* Desktop */
className="lg:px-8 lg:py-4"
```

### Grid Layouts
```tsx
/* 1 column mobile, 2 tablet, 3 desktop */
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

/* 1 column mobile, 4 desktop */
className="grid grid-cols-1 lg:grid-cols-4 gap-4"
```

### Visibility
```tsx
/* Hide on mobile, show on desktop */
className="hidden sm:block"

/* Show on mobile, hide on desktop */
className="block sm:hidden"
```

## 🎯 Common Patterns

### Stat Card
```tsx
<Card className="shadow-healthcare border-[#E5E7EB]">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium text-[#6B7280]">
      Total Cases
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-[#0077B6]">24</div>
    <p className="text-xs text-[#6B7280] mt-1">
      Active this month
    </p>
  </CardContent>
</Card>
```

### Progress Bar
```tsx
<div className="progress-bar">
  <div className="progress-fill" style={{ width: '60%' }}></div>
</div>

/* With label */
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span>60%</span>
  </div>
  <div className="progress-bar">
    <div className="progress-fill" style={{ width: '60%' }}></div>
  </div>
</div>
```

### Data Table Row
```tsx
<table className="data-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>
        <span className="status-active">Active</span>
      </td>
      <td>Jan 20, 2026</td>
    </tr>
  </tbody>
</table>
```

## 💡 Tips & Best Practices

### DO's ✅
- Use consistent spacing (multiples of 4px)
- Apply font-family styles to maintain typography
- Use semantic HTML elements
- Include icons with text for clarity
- Respect accessibility guidelines
- Use color to support, not replace, information

### DON'Ts ❌
- Don't use red for decoration
- Don't rely solely on color to convey meaning
- Don't skip heading levels
- Don't forget hover states
- Don't use all caps for long text
- Don't overcrowd interfaces

---

**Quick Tip**: All these patterns are already implemented in the codebase. Look at ProfileForm.tsx and DashboardLayout.tsx for complete examples!
