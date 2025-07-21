// Import Firebase
import { auth, db } from './firebase-config.js';
import {
  signOut, onAuthStateChanged, updateEmail,
  updatePassword,
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection, addDoc, query, orderBy, onSnapshot, doc,
  deleteDoc, getDocs, getDoc, updateDoc, setDoc, increment, limit
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const recipesMap = {};

// Cloudinary Upload
async function uploadToCloudinary(file, type = 'image') {
  const cloudName = 'dk8x0cl0c';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "recipe_unsigned");

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

//  Auth Check
onAuthStateChanged(auth, user => {
  if (!user) window.location.href = 'index.html';
  else {
     document.getElementById("userEmailDisplay").innerText = user.email;
    loadRecipes();
    loadForum();
    loadMealPlan(user.uid);
    loadAnalyticsDashboard();
    loadSharedRecipes();
    adjustFromURL();
    createFilterUI();
  }
});

function adjustIngredients(ingredients, originalServings, newServings) {
  const factor = newServings / originalServings;
  return ingredients.map(i => {
    const match = i.match(/^\s*(\d+(?:\.\d+)?)(.*)/);
    return match ? `${(parseFloat(match[1]) * factor).toFixed(1)}${match[2]}` : i;
  });
}

window.recalculateServings = (id, originalServings) => {
  const input = document.getElementById(`newServings-${id}`);
  const newVal = Number(input.value);
  if (!newVal || newVal <= 0) {
    alert("Please enter a valid number.");
    return;
  }

  const updated = adjustIngredients(recipesMap[id].ingredients, originalServings, newVal);
  document.getElementById(`updatedIngredients-${id}`).innerHTML = `<strong>Updated:</strong> ${updated.join(', ')}`;
};

async function updateUserProfile() {
  const name = document.getElementById("displayName")?.value;
  const newEmail = document.getElementById("newEmail")?.value;
  const newPassword = document.getElementById("newPassword")?.value;
  const user = auth.currentUser;
  try {
    if (name) await setDoc(doc(db, "users", user.uid), { name }, { merge: true });
    if (newEmail && newEmail !== user.email) await updateEmail(user, newEmail);
    if (newPassword) await updatePassword(user, newPassword);
    alert("✅ Profile updated.");
  } catch (err) {
    alert("Error updating profile: " + err.message);
  }
}



async function deleteUserProfile() {
  if (!confirm("Are you sure you want to delete your account?")) return;
  try {
    await deleteUser(auth.currentUser);
    alert("Account deleted.");
    location.href = 'index.html';
  } catch (err) {
    alert("Error deleting account: " + err.message);
  }
}


// Add profile display element
window.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveNameBtn");
  if (saveBtn) saveBtn.addEventListener("click", updateUserProfile);
  const updateBtn = document.getElementById("updateAuthBtn");
  if (updateBtn) updateBtn.addEventListener("click", updateUserProfile);
  const deleteBtn = document.getElementById("deleteAccountBtn");
  if (deleteBtn) deleteBtn.addEventListener("click", deleteUserProfile);


});

function loadAnalyticsDashboard() {
  const analyticsDiv = document.getElementById("analyticsDashboard");
  if (!analyticsDiv) return;

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;

  getDocs(collection(db, "recipes")).then(async (snapshot) => {
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      totalViews += data.views || 0;
      totalLikes += data.likes || 0;

      const commentsSnap = await getDocs(collection(doc(db, "recipes", docSnap.id), "comments"));
      totalComments += commentsSnap.size;
    }

    analyticsDiv.innerHTML = `
      <h3>📊 Dashboard Recipes </h3>
      <p><strong>Total Recipes:</strong> ${snapshot.size}</p>
      <p><strong>Total Views:</strong> ${totalViews}</p>
      <p><strong>Total Likes:</strong> ${totalLikes}</p>
      <p><strong>Total Comments:</strong> ${totalComments}</p>
    `;
  });
}
//  Load Shared Recipes
function loadSharedRecipes() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedId = urlParams.get("shareId");
  if (sharedId) {
    getDoc(doc(db, "recipes", sharedId)).then(docSnap => {
      if (docSnap.exists()) {
        const recipe = docSnap.data();
        alert(`Shared Recipe: ${recipe.title}\nBy: ${recipe.user}`);
      } else {
        alert("Recipe not found.");
      }
    });
  }
}

//  Share Recipe by ID
window.getShareableLink = (id) => {
  const link = `${window.location.origin}/recipe.html?shareId=${id}`;
  navigator.clipboard.writeText(link).then(() => alert("🔗 Link copied: " + link));
};

// --- Adjust Servings from URL ---
function adjustFromURL() {
  const val = new URLSearchParams(location.search).get("servings");
  if (val) {
    document.getElementById("desiredServings").value = val;
    document.querySelector("#adjustServingsSection button")?.click();
  }
}

function createFilterUI() {
  const div = document.createElement('div');
  div.style.margin = '10px 0';
  div.innerHTML = `
    <input id="filterInput" placeholder="Filter by tag/category" />
    <button onclick="filterRecipes()">Filter</button>
  `;
  const box = document.getElementById("filterBox");
  if (box) box.appendChild(div);
}

window.filterRecipes = () => {
  const val = document.getElementById('filterInput').value.toLowerCase();
  document.querySelectorAll('.recipe').forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(val) ? 'block' : 'none';
  });
};
document.getElementById("logoutBtn").addEventListener('click', () => {
  signOut(auth).then(() => location.href = 'index.html');
});

//  Submit Recipe

document.getElementById("recipeForm").addEventListener('submit', async (e) => {
  e.preventDefault();
  const editingId = e.target.dataset.editingId;
  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value.split(',').map(i => i.trim());
  const steps = document.getElementById('instructions').value.split('.').map(s => s.trim()).filter(Boolean);
  const tags = document.getElementById('tags').value.split(',').map(t => t.trim());
  const category = document.getElementById('category').value;
  const servings = Number(document.getElementById('servings').value);
  const imageFile = document.getElementById('productImageInput')?.files[0];
  const videoFile = document.getElementById('videoUpload')?.files[0];

  let imageUrl = '', videoUrl = '';

  if (imageFile) {
    imageUrl = await uploadToCloudinary(imageFile, 'image');
    let imgPreview = document.getElementById("imgPreview");
    if (!imgPreview) {
      imgPreview = document.createElement("img");
      imgPreview.id = "imgPreview";
      imgPreview.style.width = '200px';
      document.getElementById("recipeForm").appendChild(imgPreview);
    }
    imgPreview.src = imageUrl;
    imgPreview.style.display = 'block';
  }

  if (videoFile) {
    videoUrl = await uploadToCloudinary(videoFile, 'video');
    let videoPreview = document.getElementById("videoPreview");
    if (!videoPreview) {
      videoPreview = document.createElement("video");
      videoPreview.id = "videoPreview";
      videoPreview.controls = true;
      videoPreview.style.width = '200px';
      document.getElementById("recipeForm").appendChild(videoPreview);
    }
    videoPreview.src = videoUrl;
    videoPreview.style.display = 'block';
  }

  const recipesSnapshot = await getDocs(collection(db, 'recipes'));
  for (const docSnap of recipesSnapshot.docs) {
    const r = docSnap.data();
    if (
      Array.isArray(r.ingredients) &&
      Array.isArray(r.steps) &&
      r.ingredients.join(',') === ingredients.join(',') &&
      r.steps.join('.') === steps.join('.')
    ) {
      alert("Duplicate recipe already exists.");
      return;
    }
  }

  await addDoc(collection(db, 'recipes'), {
    title, ingredients, steps, tags, category, servings,
    imageUrl, videoUrl, views: 0, likes: 0,
    user: auth.currentUser.email,
    createdAt: new Date()
  });

  document.getElementById("recipeForm").reset();
  const imgPreview = document.getElementById("imgPreview");
  const videoPreview = document.getElementById("videoPreview");
  if (imgPreview) {
    imgPreview.src = "";
    imgPreview.style.display = 'none';
  }
  if (videoPreview) {
    videoPreview.src = "";
    videoPreview.style.display = 'none';
  }

  alert("Recipe added!");

  setTimeout(() => {
    const container = document.getElementById("recipesContainer");
    if (container) container.scrollIntoView({ behavior: 'smooth' });
  }, 500);
});

//  Load Recipes
function loadRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(50));
  const container = document.getElementById('recipesContainer');

  onSnapshot(q, snapshot => {
    container.innerHTML = '';
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      const id = docSnap.id;
      recipesMap[id] = r;

      const div = document.createElement('div');
      div.className = 'recipe-card';
      div.innerHTML = `
        <div class="action-group">
       <input type="number" id="newServings-${id}" placeholder="New Servings" />
       <button onclick="recalculateServings('${id}', ${r.servings ?? 1})">Update</button>
       <div id="updatedIngredients-${id}"></div>
      </div>
        <h3>${r.title}</h3>
        <p><strong>By:</strong> ${r.user}</p>
        <p><strong>Views:</strong> ${r.views || 0}</p>
        <p><strong>Likes:</strong> ${r.likes || 0}</p>
        <p><strong>Ingredients:</strong> ${r.ingredients.join(', ')}</p>
        <p><strong>Steps:</strong> ${renderMarkdown(r.steps.join('. '))}</p>
        ${r.imageUrl ? `<img src="${r.imageUrl}" width="200">` : ''}
        ${r.videoUrl ? `<video width="200" controls src="${r.videoUrl}"></video>` : ''}
        <p><strong>Tags:</strong> ${r.tags.join(', ')}</p>
        <p><strong>Category:</strong> ${r.category}</p>
        <p><strong>Servings:</strong> ${r.servings}</p>
        <div class="action-group">
          <button onclick="deleteRecipe('${id}')">🗑️ Delete</button>
          <button onclick="editRecipe('${id}')">✏️ Edit</button>
          <button onclick="saveFavorite('${id}')">❤️ Favorite</button>
          <button onclick="likeRecipe('${id}')">👍 Like</button>
        </div>

        <div class="action-group">
          <label>⭐ Rate:</label>
          <select onchange="rateRecipe('${id}', this.value)">
            <option value="">Select</option>
            <option value="1">⭐</option>
            <option value="2">⭐⭐</option>
            <option value="3">⭐⭐⭐</option>
            <option value="4">⭐⭐⭐⭐</option>
            <option value="5">⭐⭐⭐⭐⭐</option>
          </select>
        </div>

        <div class="action-group">
          <input id="comment-${id}" placeholder="💬 Write a comment..." />
          <button onclick="postComment('${id}')">Post</button>
          <div id="comments-${id}" class="comment-box"></div>
        </div>


        <div class="action-group">
        <button onclick="exportRecipeToPDF(this)">📄 Export PDF</button>
        

        </div>

        <div class="action-group">
          <strong>🔗 Share:</strong><br>
          <a href="https://wa.me/?text=${encodeURIComponent(r.title)}" target="_blank">📤 WhatsApp</a><br>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://yourapp.com/recipe/${id}" target="_blank">📘 Facebook</a>
        </div>
      `;
      container.appendChild(div);

      // Load Comments Live
      const commentsRef = collection(doc(db, "recipes", id), "comments");
      onSnapshot(query(commentsRef, orderBy("createdAt", "asc")), snap => {
        const commentsBox = document.getElementById(`comments-${id}`);
        commentsBox.innerHTML = '';
        snap.forEach(c => {
          const d = c.data();
          commentsBox.innerHTML += `<p><strong>${d.user}</strong>: ${d.text}</p>`;
        });
      });
    });
  });
}

// Utilities
function renderMarkdown(text) {
  return text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>');
}


// Interactive Actions
window.deleteRecipe = async (id) => {
  if (confirm("Delete recipe?")) await deleteDoc(doc(db, 'recipes', id));
};
window.editRecipe = id => {
  const r = recipesMap[id];
  if (!r) return;
  document.getElementById("title").value = r.title;
  document.getElementById("ingredients").value = r.ingredients.join(", ");
  document.getElementById("tags").value = r.tags.join(", ");
  document.getElementById("category").value = r.category;
  document.getElementById("servings").value = r.servings;
  quill.root.innerHTML = r.steps.join(". ");
  document.getElementById("recipeForm").dataset.editingId = id;
  document.querySelector("#recipeForm button[type='submit']").textContent = "Update Recipe";
};

window.saveFavorite = async (id) => {
  const userRef = doc(db, "users", auth.currentUser.uid);
  await addDoc(collection(userRef, "favorites"), { recipeId: id });
  alert("Saved to favorites!");
};

window.likeRecipe = async (id) => {
  await updateDoc(doc(db, "recipes", id), { likes: increment(1) });
};

window.rateRecipe = async (id, rating) => {
  await addDoc(collection(doc(db, "recipes", id), "ratings"), {
    rating: Number(rating),
    user: auth.currentUser.email,
    createdAt: new Date()
  });
  alert("Thanks for rating!");
};

window.postComment = async (id) => {
  const input = document.getElementById(`comment-${id}`);
  const comment = input.value.trim();
  if (!comment) return alert("Enter comment!");
  await addDoc(collection(doc(db, "recipes", id), "comments"), {
    text: comment,
    user: auth.currentUser.email,
    createdAt: new Date()
  });
  input.value = '';
};



//  Generate Shareable Link
window.getShareableLink = (id) => {
  const link = `${window.location.origin}/recipe.html?shareId=${id}`;
  navigator.clipboard.writeText(link)
    .then(() => alert("🔗 Link copied: " + link))
    .catch((err) => alert("Failed to copy link: " + err));
};

let quill;
document.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.querySelector('#editor');
  if (editorContainer) {
    quill = new Quill('#editor', {
      theme: 'snow',
      placeholder: 'Write your recipe instructions...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

     const editorRoot = editorContainer.querySelector('.ql-editor');
    if (editorRoot) {
      editorRoot.style.color = 'black';
    }

    const form = document.getElementById("recipeForm");
    form.addEventListener("submit", function () {
      const instructionsHTML = quill.root.innerHTML;
      document.getElementById("instructions").value = instructionsHTML;
    });
  }
});
window.inviteCollaborator = async () => {
  const email = prompt("Enter email of collaborator:");
  if (!email) return alert("No email entered.");

  const recipeId = prompt("Enter recipe ID to share:"); 
  if (!recipeId) return alert("No recipe ID.");

  const recipeRef = doc(db, "recipes", recipeId);
  const recipeSnap = await getDoc(recipeRef);

  if (!recipeSnap.exists()) return alert("Recipe not found");

  const data = recipeSnap.data();
  if (data.user !== auth.currentUser.email) return alert("Only the recipe owner can invite collaborators.");

  await updateDoc(recipeRef, {
    collaborators: [...(data.collaborators || []), email]
  });

  alert(`✅ Invited ${email} to collaborate on this recipe.`);
};

window.suggestSubstitutions = () => {
  const ingredientsInput = document.getElementById("ingredients");
  let outputBox = document.getElementById("substitutionSuggestions");

  if (!ingredientsInput) {
    alert("Please enter ingredients first.");
    return;
  }

  // Create result container if not present
  if (!outputBox) {
    outputBox = document.createElement("div");
    outputBox.id = "substitutionSuggestions";
    outputBox.className = "output-box";
    ingredientsInput.parentNode.insertBefore(outputBox, ingredientsInput.nextSibling);
  }

  const ingredients = ingredientsInput.value
    .toLowerCase()
    .split(',')
    .map(i => i.trim())
    .filter(Boolean);

  if (ingredients.length === 0) {
    outputBox.innerHTML = "<p>Please enter at least one ingredient.</p>";
    return;
  }

  const substitutionMap = {
    "milk": "almond milk, oat milk, soy milk",
    "egg": "mashed banana, chia gel, flaxseed meal",
    "butter": "coconut oil, olive oil, vegan butter",
    "sugar": "honey, jaggery, maple syrup",
    "flour": "almond flour, rice flour, oat flour",
    "cream": "coconut cream, cashew cream",
    "yogurt": "plant-based yogurt, silken tofu"
  };

  const suggestions = ingredients.map(item => {
    return substitutionMap[item]
      ? `<li><strong>${item}:</strong> ${substitutionMap[item]}</li>`
      : `<li><strong>${item}:</strong> No substitution found</li>`;
  });

  outputBox.innerHTML = `
    <h4>Suggested Substitutions:</h4>
    <ul>${suggestions.join('')}</ul>
  `;
};


// AI & Forum
window.postForum = async () => {
  const msg = document.getElementById("forumMessage").value.trim();
  if (!msg) return;
  await addDoc(collection(db, "forums"), {
    message: msg,
    user: auth.currentUser.email,
    createdAt: new Date()
  });
  document.getElementById("forumMessage").value = "";
  alert("Posted!");
};

function loadForum() {
  const forumContainer = document.getElementById("forumContainer");
  onSnapshot(query(collection(db, "forums"), orderBy("createdAt", "desc")), snap => {
    forumContainer.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      forumContainer.innerHTML += `<p><strong>${d.user}:</strong> ${d.message}</p>`;
    });
  });
}
// Export Recipe to PDF using html2canvas + jsPDF
window.exportRecipeToPDF = async (btn) => {
  const card = btn.closest(".recipe-card");
  if (!card) return alert("Recipe card not found");

  const canvas = await html2canvas(card);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jspdf.jsPDF();
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save("recipe.pdf");
};


//  AI Recipe Suggestion Function
window.suggestRecipesAI = async () => {
  const ingredientsInput = document.getElementById("availableIngredients");
  const preferenceInput = document.getElementById("dietaryPreference");
  const suggestionsBox = document.getElementById("suggestions");

  if (!ingredientsInput || !preferenceInput || !suggestionsBox) {
    alert("Required fields not found in the HTML.");
    return;
  }

  const ingredients = ingredientsInput.value
    .toLowerCase()
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const preference = preferenceInput.value;

  if (ingredients.length === 0) {
    suggestionsBox.innerHTML = "<p>Please enter some ingredients.</p>";
    return;
  }

  suggestionsBox.innerHTML = "<p>Generating AI suggestions...</p>";

  try {
    // Dummy suggestions — replace with actual AI API if needed
    const suggestions = [
      `Try a simple stir-fry using ${ingredients.join(', ')}`,
      `How about a ${preference} salad with ${ingredients[0]} and ${ingredients[1] || ingredients[0]}?`,
      `Make a warm soup with ${ingredients.slice(0, 3).join(', ')}.`,
    ];

    suggestionsBox.innerHTML = `<ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`;
  } catch (error) {
    console.error("Error suggesting recipes:", error);
    suggestionsBox.innerHTML = "<p>Could not generate suggestions. Please try again.</p>";
  }
};

//  AI Nutrition Info Function
window.analyzeNutrition = async () => {
  const ingredientsInput = document.getElementById("ingredients");
  const nutritionOutput = document.getElementById("nutritionResult");

  if (!ingredientsInput || !nutritionOutput) {
    alert("Required fields not found.");
    return;
  }

  const ingredients = ingredientsInput.value
    .toLowerCase()
    .split(',')
    .map(i => i.trim())
    .filter(Boolean);

  if (ingredients.length === 0) {
    nutritionOutput.innerHTML = "<p>Please enter ingredients first.</p>";
    return;
  }

  nutritionOutput.innerHTML = "<p>Analyzing nutrition...</p>";

  try {
    // Dummy nutrition info — simulate analysis
    const nutritionFacts = ingredients.map(item => {
      return `${item}: ~${Math.floor(Math.random() * 50 + 50)} kcal`;
    });

    nutritionOutput.innerHTML = `<ul>${nutritionFacts.map(f => `<li>${f}</li>`).join('')}</ul>`;
  } catch (err) {
    console.error("Nutrition analysis error:", err);
    nutritionOutput.innerHTML = "<p>Failed to analyze nutrition. Try again.</p>";
  }
};




//  Meal Plan
window.saveMealPlan = async () => {
  const plan = document.getElementById("mealPlan").value.trim();
  if (!plan) return alert("Write your meal plan.");
  await setDoc(doc(db, "mealPlans", auth.currentUser.uid), {
    plan, user: auth.currentUser.email, updatedAt: new Date()
  });
  const status = document.getElementById("saveStatus");
  status.innerText = "✔️ Saved!";
  status.style.color = "orange"
  
  setTimeout(() => status.innerText = "", 5000);
};

async function loadMealPlan(userId) {
  const snap = await getDoc(doc(db, "mealPlans", userId));
  if (snap.exists()) document.getElementById("mealPlan").value = snap.data().plan;
}

//  Dark Mode
const toggleBtn = document.getElementById('darkModeToggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
  });
}
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
  }
});
