[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# Candidate Choosing System 🎯

A modern, production-ready candidate evaluation and comparison platform developed for Kovan Studio. This system streamlines the internship candidate assessment process with AI-powered evaluations and intuitive user interface.

## 📋 Overview

The **Candidate Choosing System** is a web-based platform that enables recruiters to evaluate, filter, compare, and manage candidate profiles efficiently. Built as a case study project, it integrates Google Sheets for data management, Gemini AI for candidate evaluation, and n8n for workflow automation.

**Development Time:** ~12 hours | **Status:** Production-Ready

## ✨ Key Features

- **Dynamic Candidate Listing** - Real-time candidate data pulled from Google Sheets
- **Advanced Filtering & Sorting** - Filter by AI score and sort by name or performance
- **Multi-Candidate Comparison** - Compare up to 6 candidates side-by-side with detailed metrics
- **Detailed Candidate Profiles** - Modal-based profile view with AI insights
- **AI-Powered Evaluation** - Automated candidate assessment using Gemini AI
- **Responsive Design** - Beautiful UI with light/dark theme support
- **Automated Data Flow** - One-click refresh triggering full AI evaluation pipeline

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML/CSS/JavaScript** | Frontend Development |
| **Google Apps Script** | Data Integration & Processing |
| **Google Sheets** | Data Storage |
| **Google Forms** | Candidate Input |
| **Gemini AI** | Candidate Evaluation |
| **n8n** | Workflow Automation |
| **ngrok** | Secure Tunneling |
| **GitHub** | Version Control |

## 🚀 Quick Start

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Login credentials (provided by Kovan Studio)

### Usage

1. **Access the Platform**
   - Navigate to `index.html`
   - Enter credentials: `kovan.studio` / `candidatepanel`

2. **View Candidates**
   - Browse all candidates on the dashboard
   - Use filters to narrow down by AI score (High/Medium/Low)
   - Sort by name or score

3. **Compare Candidates**
   - Select up to 6 candidates using checkboxes
   - Click the "Karşılaştır" button to compare side-by-side
   - View detailed metrics and AI recommendations

4. **View Detailed Profile**
   - Click any candidate card to open full profile modal
   - View contact information and AI analysis
   - Read strengths, risks, and recommendations

5. **Refresh Data**
   - Click "Yenile" button to trigger AI evaluation workflow
   - System waits ~15 seconds for processing
   - New data automatically displayed

## 📁 Project Structure

```
Candidate-Choosing-System/
├── index.html              # Login page
├── dashboard.html          # Main candidate dashboard
├── developer.html          # Project information page
├── script.js              # Core application logic
├── style.css              # Styling & themes
├── manifest.json          # PWA configuration
├── icons/                 # Logo and avatars
│   ├── kovan-logo.svg
│   ├── default-avatar-male.png
│   └── default-avatar-female.png
└── README.md              # This file
```

## 🔧 Configuration

### Google Apps Script URL
Update the `GOOGLE_SCRIPT_URL` in `script.js` to your Google Apps Script endpoint that returns candidate data.

### n8n Webhook URL
Update the `N8N_TRIGGER_URL` in `script.js` with your ngrok tunnel URL and n8n webhook path:
```javascript
const N8N_TRIGGER_URL = 'https://your-ngrok-url.ngrok-free.app/webhook/your-webhook-id';
```

## 📊 Data Flow

```
Google Forms → Google Sheets → Google Apps Script
         ↓
    n8n Workflow (via ngrok)
         ↓
    Gemini AI Evaluation
         ↓
    Updated Google Sheets
         ↓
    Frontend Display
```

## 🎨 Features in Detail

### Filtering & Sorting
- **Score Filters:** High (70+), Medium (50-69), Low (<50)
- **Sort Options:** By score (ascending/descending), by name (A-Z)

### AI Evaluation Metrics
- **AI General Score:** Overall candidate rating
- **Strengths:** Key strengths identified by AI
- **Risks:** Potential concerns
- **Recommendation:** AI-generated recommendation
- **Technologies:** Skills and experience

### Theme Support
- Automatic theme detection based on system preference
- Manual toggle between light and dark modes
- Persistent theme preference using localStorage

## 📱 Responsive Design

- Mobile-friendly interface
- Works on tablets and desktop
- Optimized for all screen sizes
- Progressive Web App (PWA) ready

## 🔐 Security Notes

- Credentials stored in sessionStorage (cleared on logout)
- No sensitive data cached locally
- Use environment variables for production
- Consider implementing proper authentication

## 🚧 Development Process

This project was developed using Agile methodology with continuous collaboration via Gemini AI:

1. **Phase 1 (MVP):** Basic candidate listing and filtering
2. **Phase 2 (Enhancement):** Comparison, modals, theming
3. **Optimization:** Performance tuning and best practices implementation

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Eren Kaynak** - Full Stack Developer

- GitHub: [@erenkaynak](https://github.com/erenkaynak)
- LinkedIn: [Eren Kaynak](https://www.linkedin.com/in/eren-kaynak-92355533b/)

## 🤝 Contributing

While this is a case study project, feel free to fork and adapt for your own needs.

## 📞 Support

For issues or questions about this project, please contact Kovan Studio or reach out to the developer.

---

**Note:** This is a production-ready prototype developed for Kovan Studio's internship candidate evaluation process. All features have been tested and optimized for performance.