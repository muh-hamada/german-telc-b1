# German TELC B1 - Website

Beautiful, modern landing page for the German TELC B1 exam preparation app.

## 🚀 Features

- **Modern Design**: Inspired by top app landing pages with gradient backgrounds and smooth animations
- **Responsive**: Fully responsive design that works on all devices
- **Complete Legal Pages**: Privacy Policy, Terms of Service, and Data Deletion instructions
- **SEO Optimized**: Built with best practices for search engine optimization
- **Fast Loading**: Optimized for performance with lazy loading and caching

## 📱 Pages

1. **Home** - Hero section with app features and download buttons
2. **Privacy Policy** - Comprehensive privacy information
3. **Terms of Service** - Legal terms and user agreements
4. **Data Deletion** - Instructions for requesting data deletion

## 🛠️ Technology Stack

- **React** with TypeScript
- **React Router** for navigation
- **Firebase Hosting** for deployment
- **CSS3** with modern features (Grid, Flexbox, Gradients, Animations)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🔥 Firebase Deployment

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

### Deploy

1. Build the production version:
```bash
npm run build
```

2. Deploy to Firebase Hosting:
```bash
firebase deploy
```

3. Your website will be live at: `https://telc-b1-german.web.app`

## 📝 Customization

### Update App Store Links

Edit `src/pages/Home.tsx` and replace the `#android` and `#ios` href values with your actual app store URLs:

```tsx
<a href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME" ...>
<a href="https://apps.apple.com/app/YOUR_APP_ID" ...>
```

### Add App Screenshots

1. Add your app screenshots to `public/images/`
2. Update the phone mockup section in `src/pages/Home.tsx`

### Update Contact Email

The contact email is set to `muhammad.aref.ali.hamada@gmail.com`. To change it:
- Edit `src/components/Footer.tsx`
- Edit all legal pages in `src/pages/`

### Modify Colors

The main brand colors are defined in the CSS files:
- Primary gradient: `#667eea` to `#764ba2`
- Update these in `src/pages/Home.css` and other CSS files

## 🎨 Design Features

- **Gradient Hero Section**: Eye-catching gradient background inspired by modern app landing pages
- **Phone Mockup**: Displays app interface in a realistic phone frame
- **Feature Cards**: Showcases app features with icons and descriptions
- **Smooth Animations**: Fade-in and slide animations for better user experience
- **Modern Typography**: Clean, readable fonts with proper hierarchy

## 📱 Responsive Breakpoints

- **Desktop**: > 968px
- **Tablet**: 768px - 968px
- **Mobile**: < 768px

## 🔒 Legal Compliance

The website includes comprehensive legal pages that comply with:
- GDPR requirements
- App Store guidelines
- Privacy regulations
- Data protection laws

## 🚀 Performance

- Optimized bundle size
- Lazy loading for images
- Code splitting with React Router
- Cached static assets
- Fast initial load time

## 📊 SEO

To improve SEO, update:
- `public/index.html` - meta tags, title, description
- `public/manifest.json` - app name and description
- Add `robots.txt` for search engine crawlers
- Add sitemap.xml

## 🤝 Support

For questions or issues, contact: muhammad.aref.ali.hamada@gmail.com

## 📄 License

All rights reserved. This website is for the German TELC B1 app.
