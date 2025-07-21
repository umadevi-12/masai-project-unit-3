# masai-project-unit-3
# 🍽️ RecipeSharingPlatform_Food

A web-based platform for home chefs and food enthusiasts to share, discover, and manage their favorite recipes — powered by Firebase and AI-enhanced features.

##  Project Overview

**RecipeSharingPlatform_Food** enables users to create, browse, and interact with a global collection of recipes. The platform supports media-rich content, user interaction, personalized meal planning, and intelligent AI-powered features to create an engaging culinary community.

---

## Project Goals

- Create a collaborative space for recipe sharing and discovery.
- Enable users to manage personal recipe collections.
- Encourage creativity and interaction through social features.
- Enhance user experience with AI-driven tools.

---

## 🔐 Features

###  User Authentication
- Secure registration and login using Firebase Authentication.
- Manage personal accounts and recipe contributions.

###  Recipe Creation & Management
- Users can add, edit, and delete recipes.
- Recipes include title, ingredients, steps, images, and video support (via Cloudinary).
- Rich text formatting for instructions (bold, italics, links, etc.).

###  Tagging & Categorization
- Recipes can be tagged with keywords like `Vegan`, `Dessert`, `Low-Carb`, etc.
- Browse recipes by category or tag for better discoverability.

###  Favorites & Bookmarks
- Save and revisit favorite recipes anytime.

###  Weekly Meal Planner
- Drag and drop saved recipes into a weekly meal calendar.
- Save and update meal plans in Firestore.

###  Community Interaction
- Post comments under each recipe (real-time Firestore updates).
- Add star ratings to recipes.
- Share recipes directly via WhatsApp or Facebook.

---

##  Unique & Advanced Features

### Duplicate Recipe Detection
- Checks for existing recipes based on ingredients and method.
- Warns users about potential duplicates to maintain unique content.

### Recipe Analytics Dashboard
- Shows likes, comments, and view counts.
- Helps users track recipe popularity and engagement.

###  Recipe Collaboration
- Supports shared editing of recipes.
- Multiple users can co-create a single recipe collaboratively.

###  AI-Powered Suggestions
- Suggest recipes based on available ingredients and dietary preferences.
- Smart filtering and personalized results using basic ML logic.

###  Dynamic Serving Adjustments
- Automatically recalculates ingredient quantities based on user-input serving size.

###  Nutrition Analysis
- AI-based breakdown of calories, protein, fat, carbs, and vitamins for each recipe.
- Nutritional suggestions powered by OpenAI or food databases.

---

## UI & Design Features

- Responsive design for mobile, tablet, and desktop.
- Dark mode toggle for a better user experience.
- Elegant input forms and rich UI styling (glassmorphism, gradients, shadows, etc.).

---

##  Data Export & Sharing

- Export any recipe as a well-formatted PDF (using `jsPDF`).
- Share recipes via WhatsApp, Facebook, or direct link.

---

##  Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Media Upload**: Cloudinary
 **PDF Export**: jsPDF, html2canvas
 **AI/Nutrition**: (Mocked with simple logic or third-party API integration)



##  Getting Started

### 1. Clone the Repo

git : https://github.com/umadevi-12/masai-project-unit-3/tree/main/frontend
netlify : https://magnificent-granita-59d94e.netlify.app/ 
presenation link : https://github.com/umadevi-12/masai-project-unit-3

