/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");


const workerURL= "https://loreal-worker.jhcandio.workers.dev/"

/* Store selected products by their id */
let selectedProductIds = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  // This object keeps track of which product descriptions are visible
  if (!window.visibleDescriptions) window.visibleDescriptions = {};

  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div 
      class="product-card${selectedProductIds.includes(product.id) ? " selected" : ""}${window.visibleDescriptions[product.id] ? " expanded" : ""}" 
      data-id="${product.id}">
      <div class="card-header">
        <img src="${product.image}" alt="${product.name}">
        <button class="dropdown-btn" data-id="${product.id}" aria-label="${window.visibleDescriptions[product.id] ? "Hide" : "Show"} description">
          <span class="dropdown-icon" style="display:inline-block;transition:transform 0.2s;${window.visibleDescriptions[product.id] ? "transform:rotate(180deg);" : ""}">&#9660;</span>
        </button>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <div class="product-desc" style="display:${window.visibleDescriptions[product.id] ? "block" : "none"};margin-top:8px;font-size:14px;color:#333;">
          ${product.description || ""}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event to each product card for selection
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent click if the dropdown button was clicked
      if (e.target.classList.contains("dropdown-btn") || e.target.classList.contains("dropdown-icon")) return;
      const id = Number(card.getAttribute("data-id"));
      if (selectedProductIds.includes(id)) {
        // Unselect if already selected
        selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      } else {
        // Add to selected (persist all previous selections)
        selectedProductIds.push(id);
      }
      saveSelectedProducts(); // <-- Save to localStorage
      loadProducts().then((allProducts) => {
        displayProducts(products); // Only refresh the visible grid
        updateSelectedProducts(allProducts); // Always show all selected
      });
    });
  });

  // Add click event to each dropdown button
  document.querySelectorAll(".dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent selecting the card
      const id = btn.getAttribute("data-id");
      // Toggle visibility for this product's description
      window.visibleDescriptions[id] = !window.visibleDescriptions[id];
      displayProducts(products); // Re-render to update UI
    });
  });
}

/* Update the Selected Products section */
function updateSelectedProducts(allProducts) {
  // Find selected product objects
  const selected = allProducts.filter((p) => selectedProductIds.includes(p.id));
  if (selected.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected yet.</div>`;
    // Remove Clear All button if present
    const existingBtn = document.getElementById("clearSelectedProducts");
    if (existingBtn) existingBtn.remove();
    return;
  }
  selectedProductsList.innerHTML = selected
    .map(
      (product) => `
      <div class="selected-product-item" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" title="${product.name}" style="width:40px;height:40px;object-fit:contain;">
        <span>${product.name}</span>
        <button class="remove-btn" title="Remove" aria-label="Remove ${product.name}">&times;</button>
      </div>
    `
    )
    .join("");

  // Add Clear All button if not present
  if (!document.getElementById("clearSelectedProducts")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedProducts";
    clearBtn.textContent = "Clear All";
    clearBtn.style.margin = "16px 0 0 0";
    clearBtn.style.padding = "8px 18px";
    clearBtn.style.background = "#fff";
    clearBtn.style.color = "#c00";
    clearBtn.style.border = "1.5px solid #c00";
    clearBtn.style.borderRadius = "6px";
    clearBtn.style.cursor = "pointer";
    clearBtn.style.fontWeight = "bold";
    clearBtn.style.fontSize = "15px";
    clearBtn.style.display = "block";
    clearBtn.style.transition = "background 0.2s";
    clearBtn.addEventListener("mouseover", () => (clearBtn.style.background = "#ffeaea"));
    clearBtn.addEventListener("mouseout", () => (clearBtn.style.background = "#fff"));
    selectedProductsList.parentElement.appendChild(clearBtn);
    clearBtn.addEventListener("click", () => {
      selectedProductIds = [];
      saveSelectedProducts();
      displayProducts(allProducts);
      updateSelectedProducts(allProducts);
    });
  }

  // Add remove button event
  document.querySelectorAll(".selected-product-item .remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering card click
      const id = Number(btn.parentElement.getAttribute("data-id"));
      selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      saveSelectedProducts(); // <-- Save to localStorage
      displayProducts(allProducts);
      updateSelectedProducts(allProducts);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  // Filter products by the selected category
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  // Display only the filtered products in the grid,
  // but always show all selected products in the "Selected Products" section
  displayProducts(filteredProducts);
  updateSelectedProducts(products); // Pass ALL products, not just filtered
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

// Get a reference to the "Generate Routine" button
const generateRoutineBtn = document.getElementById("generateRoutine");

// Store the conversation history for the chat
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful skincare and beauty advisor. Limit responses to 200 words or less. Using the products/details sent to you, build a sensible routine using said products. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or related topics. If asked about anything else, politely say you can only answer beauty-related questions. Don't attempt to display images, and only include the routine and details about products that are relevant to the routine. Limit attempts at formatting."
  }
];

// Update the Generate Routine button logic to use conversationHistory
generateRoutineBtn.addEventListener("click", async () => {
  // Load all products from the JSON file
  const allProducts = await loadProducts();

  // Find the selected product objects using their IDs
  const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));

  // If no products are selected, show a message and stop
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `<div class="placeholder-message">Please select at least one product to generate a routine.</div>`;
    return;
  }

  // Reset conversation history with system prompt and selected products
  conversationHistory = [
    conversationHistory[0], // keep the system prompt
    {
      role: "user",
      content: `Here are the selected products as JSON:\n${JSON.stringify(selectedProducts, null, 2)}`
    }
  ];

  // Show a loading message in the chat window
  chatWindow.innerHTML = `<div class="placeholder-message">Generating your routine...</div>`;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content
      });

      // Show both the user's product selection and the AI's response as chat bubbles, skipping system and product JSON
      let chatHtml = "";
      for (let i = 2; i < conversationHistory.length; i++) {
        const msg = conversationHistory[i];
        if (msg.role === "user") {
          chatHtml += `<div class="chat-bubble user-bubble"><strong>You:</strong> ${msg.content}</div>`;
        } else if (msg.role === "assistant") {
          chatHtml += `<div class="chat-bubble ai-bubble">${msg.content}</div>`;
        }
      }
      chatWindow.innerHTML = chatHtml;
    } else {
      chatWindow.innerHTML = `<div class="placeholder-message">Sorry, I couldn't generate a routine. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class="placeholder-message">There was an error generating your routine. Please try again later.</div>`;
  }
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input from the chatbox
  const userInput = document.getElementById("userInput").value.trim();

  // If the input is empty, do nothing
  if (!userInput) return;

  // Add the user's question to the conversation history
  conversationHistory.push({
    role: "user",
    content: userInput
  });

  // Show the user's question and a loading message in the chat window
  let chatHtml = "";
  // Start from index 2 to skip the system prompt and initial product JSON
  for (let i = 2; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i];
    if (msg.role === "user") {
      chatHtml += `<div class="chat-bubble user-bubble"><strong>You:</strong> ${msg.content}</div>`;
    } else if (msg.role === "assistant") {
      chatHtml += `<div class="chat-bubble ai-bubble">${msg.content}</div>`;
    }
  }
  chatHtml += `<div class="placeholder-message">Thinking...</div>`;
  chatWindow.innerHTML = chatHtml;

  // Clear the input field
  document.getElementById("userInput").value = "";

  try {
    // Send the full conversation history to the Cloudflare Worker (and OpenAI)
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    // Check if the AI returned a response
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add the AI's response to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content
      });

      // Display the full conversation in the chat window with bubbles, skipping system and initial product JSON
      let chatHtml = "";
      for (let i = 2; i < conversationHistory.length; i++) {
        const msg = conversationHistory[i];
        if (msg.role === "user") {
          chatHtml += `<div class="chat-bubble user-bubble"><strong>You:</strong> ${msg.content}</div>`;
        } else if (msg.role === "assistant") {
          chatHtml += `<div class="chat-bubble ai-bubble">${msg.content}</div>`;
        }
      }
      chatWindow.innerHTML = chatHtml;
    } else {
      chatWindow.innerHTML = `<div class="placeholder-message">Sorry, I couldn't answer that. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class="placeholder-message">There was an error. Please try again later.</div>`;
  }
});

// Also update the routine generation to use chat bubbles and skip the first two messages
generateRoutineBtn.addEventListener("click", async () => {
  // Load all products from the JSON file
  const allProducts = await loadProducts();

  // Find the selected product objects using their IDs
  const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));

  // If no products are selected, show a message and stop
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `<div class="placeholder-message">Please select at least one product to generate a routine.</div>`;
    return;
  }

  // Reset conversation history with system prompt and selected products
  conversationHistory = [
    conversationHistory[0], // keep the system prompt
    {
      role: "user",
      content: `Here are the selected products as JSON:\n${JSON.stringify(selectedProducts, null, 2)}`
    }
  ];

  // Show a loading message in the chat window
  chatWindow.innerHTML = `<div class="placeholder-message">Generating your routine...</div>`;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content
      });

      // Show both the user's product selection and the AI's response as chat bubbles, skipping system and product JSON
      let chatHtml = "";
      for (let i = 2; i < conversationHistory.length; i++) {
        const msg = conversationHistory[i];
        if (msg.role === "user") {
          chatHtml += `<div class="chat-bubble user-bubble"><strong>You:</strong> ${msg.content}</div>`;
        } else if (msg.role === "assistant") {
          chatHtml += `<div class="chat-bubble ai-bubble">${msg.content}</div>`;
        }
      }
      chatWindow.innerHTML = chatHtml;
    } else {
      chatWindow.innerHTML = `<div class="placeholder-message">Sorry, I couldn't generate a routine. Please try again.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML = `<div class="placeholder-message">There was an error generating your routine. Please try again later.</div>`;
  }
});

// Add chat bubble styles for user and AI
const chatBubbleStyle = document.createElement("style");
chatBubbleStyle.textContent = `
.chat-bubble {
  max-width: 80%;
  margin: 16px 0;
  padding: 16px 18px;
  border-radius: 18px;
  font-size: 17px;
  line-height: 1.6;
  word-break: break-word;
  clear: both;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.user-bubble {
  background: #fff;
  color: #111;
  border: 1.5px solid #000;
  align-self: flex-end;
  margin-left: auto;
  margin-right: 0;
}
.ai-bubble {
  background: #111;
  color: #fff;
  border: 1.5px solid #111;
  align-self: flex-start;
  margin-right: auto;
  margin-left: 0;
}
#chatWindow {
  display: flex;
  flex-direction: column;
  gap: 0;
}
`;
document.head.appendChild(chatBubbleStyle);

/* Add CSS for dropdown and expanded card, and stylize the dropdown button to look more seamless */
const style = document.createElement("style");
style.textContent = `
.product-card.selected {
  border: 2px solid #007bff;
  background: #eaf4ff;
}
.product-card {
  position: relative;
  transition: box-shadow 0.2s, border 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 220px;
  padding-top: 0;
  padding-bottom: 15px;
}
.product-card.expanded {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-color: #007bff;
  background: #f7fbff;
}
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  margin-bottom: 10px;
  margin-top: 10px; /* Add spacing above the card header */
}
.card-header img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: 10px;
  flex-shrink: 0;
  margin-top: 0;      /* Reset in case */
  margin-bottom: 0;   /* Reset in case */
}
.product-card .card-header img {
  margin-top: 4px; /* Add spacing above the image */
}
.dropdown-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;
  box-shadow: none;
  padding: 0;
}
.dropdown-btn:hover, .dropdown-btn:focus {
  background: #eaf4ff;
  outline: none;
}
.dropdown-icon {
  font-size: 22px;
  color: #007bff;
  pointer-events: none;
  transition: transform 0.2s;
}
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 70px;
  margin-left: 0;
  margin-top: 0;
}
.product-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
  margin-top: 0;
}
.product-card p {
  font-size: 14px;
  color: #666;
  margin-bottom: 0;
}
.selected-product-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f6f6f6;
  border-radius: 6px;
  padding: 4px 8px;
}
.selected-product-item .remove-btn {
  background: none;
  border: none;
  color: #c00;
  font-size: 20px;
  cursor: pointer;
  margin-left: 4px;
  line-height: 1;
}
.selected-product-item .remove-btn:focus {
  outline: 2px solid #007bff;
}
`;
document.head.appendChild(style);

/* ----------- Add Search Field for Product Filtering ----------- */
// Create a wrapper for responsive layout
const searchSection = document.querySelector('.search-section');
const filterWrapper = document.createElement('div');
filterWrapper.className = 'filter-wrapper';

// Move the existing categoryFilter into the wrapper
filterWrapper.appendChild(categoryFilter);

// Create the search input
const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'productSearch';
searchInput.placeholder = 'Search products by name or keyword...';
searchInput.className = 'product-search-input';
filterWrapper.appendChild(searchInput);

// Replace the searchSection's content with the wrapper
searchSection.innerHTML = '';
searchSection.appendChild(filterWrapper);

// Responsive styles for filter/search layout and centering
const filterStyle = document.createElement("style");
filterStyle.textContent = `
.filter-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center; /* Center items horizontally */
  justify-content: center;
  width: 100%;
}
.product-search-input {
  width: 100%;
  padding: 14px;
  font-size: 17px;
  border: 2px solid #000;
  border-radius: 8px;
  margin-bottom: 0;
  box-sizing: border-box;
  text-align: center; /* Center text in input */
}
#categoryFilter {
  width: 100%;
  min-width: 0;
  font-size: 16px;
  text-align: center;
}
@media (min-width: 700px) {
  .filter-wrapper {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  #categoryFilter {
    flex: 1 1 0%;
    max-width: 180px;
    min-width: 120px;
    margin-bottom: 0;
  }
  .product-search-input {
    flex: 5 1 0%;
    margin-bottom: 0;
  }
}
/* Center the products grid and selected products section */
#productsContainer,
#selectedProductsList,
.placeholder-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.selected-product-item {
  margin-left: auto;
  margin-right: auto;
}
.chatbox,
#chatWindow {
  align-items: center;
  justify-content: center;
}
`;
document.head.appendChild(filterStyle);

/* ----------- Update Filtering Logic ----------- */
async function filterAndDisplayProducts() {
  const products = await loadProducts();

  // Get the current category and search term
  const selectedCategory = currentCategory;
  const searchTerm = currentSearchTerm.trim().toLowerCase();

  // Filter by category if one is selected
  let filteredProducts = products;
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  // Further filter by search term if present
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      // Search in name, brand, and description (if available)
      const name = product.name ? product.name.toLowerCase() : '';
      const brand = product.brand ? product.brand.toLowerCase() : '';
      const desc = product.description ? product.description.toLowerCase() : '';
      return (
        name.includes(searchTerm) ||
        brand.includes(searchTerm) ||
        desc.includes(searchTerm)
      );
    });
  }

  // Show the filtered products in the grid
  displayProducts(filteredProducts);

  // Always show all selected products in the "Selected Products" section
  updateSelectedProducts(products);
}

/* ----------- Listen for Category and Search Changes ----------- */
categoryFilter.addEventListener("change", (e) => {
  currentCategory = e.target.value;
  filterAndDisplayProducts();
});

searchInput.addEventListener("input", (e) => {
  currentSearchTerm = e.target.value;
  filterAndDisplayProducts();
});

/* ----------- On page load, show all products ----------- */
window.addEventListener("DOMContentLoaded", () => {
  filterAndDisplayProducts();
});

/* ---------- Local Storage Helpers for Selected Products ---------- */
// Save selected product IDs to localStorage
function saveSelectedProducts() {
  localStorage.setItem("selectedProductIds", JSON.stringify(selectedProductIds));
}

// Load selected product IDs from localStorage
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProductIds");
  if (saved) {
    try {
      selectedProductIds = JSON.parse(saved);
    } catch {
      selectedProductIds = [];
    }
  }
}

// Call this on page load to restore selections
loadSelectedProducts();

/* ---------- On initial load, show selected products (if any) ---------- */
loadProducts().then((allProducts) => {
  updateSelectedProducts(allProducts);
});

// ----------- RTL Support for Routine Builder -----------

// Helper function to set RTL or LTR direction
function setDirection(isRTL) {
  // Set dir attribute on <html> and <body>
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.body.dir = isRTL ? "rtl" : "ltr";

  // Add or remove RTL class for CSS overrides
  if (isRTL) {
    document.body.classList.add("rtl-mode");
  } else {
    document.body.classList.remove("rtl-mode");
  }
}

// Example: Detect browser language for RTL (you can change this logic)
const rtlLangs = ["ar", "he", "fa", "ur"];
const userLang = navigator.language || navigator.userLanguage || "";
const isRTL = rtlLangs.some((lang) => userLang.startsWith(lang));
setDirection(isRTL);

// ----------- Add RTL CSS -----------

const rtlStyle = document.createElement("style");
rtlStyle.textContent = `
/* RTL overrides for layout and alignment */
body.rtl-mode,
body.rtl-mode * {
  direction: rtl !important;
  text-align: right !important;
}

body.rtl-mode .filter-wrapper {
  flex-direction: column;
}
@media (min-width: 700px) {
  body.rtl-mode .filter-wrapper {
    flex-direction: row-reverse;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  body.rtl-mode #categoryFilter {
    margin-left: 0;
    margin-right: 0;
  }
  body.rtl-mode .product-search-input {
    margin-left: 0;
    margin-right: 0;
  }
}

/* Product card RTL adjustments */
body.rtl-mode .product-card {
  flex-direction: row-reverse;
  text-align: right;
}
body.rtl-mode .card-header {
  flex-direction: row-reverse;
}
body.rtl-mode .card-header img {
  margin-left: 10px;
  margin-right: 0;
}
body.rtl-mode .dropdown-btn {
  right: auto;
  left: 10px;
}

/* Selected products RTL */
body.rtl-mode .selected-product-item {
  flex-direction: row-reverse;
  text-align: right;
}
body.rtl-mode .selected-product-item img {
  margin-left: 8px;
  margin-right: 0;
}

/* Chat bubbles RTL */
body.rtl-mode .chat-bubble {
  text-align: right;
}
body.rtl-mode .user-bubble {
  align-self: flex-start;
  margin-right: auto;
  margin-left: 0;
}
body.rtl-mode .ai-bubble {
  align-self: flex-end;
  margin-left: auto;
  margin-right: 0;
}
body.rtl-mode .chatbox,
body.rtl-mode #chatWindow {
  align-items: flex-end;
  justify-content: center;
}
`;
document.head.appendChild(rtlStyle);
