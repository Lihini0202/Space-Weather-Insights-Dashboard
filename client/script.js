const API_BASE = "http://localhost:4000";
const API_KEY = 'app123';  
let currentData = { nasa: null, weather: null, news: null };
let editingRecordId = null;

// Check login
async function checkLogin() {
  try {
    const res = await fetch(`${API_BASE}/auth/user`, { credentials: "include" });
    if (res.status !== 200) window.location.href = "/index.html";
  } catch (error) {
    console.error('Login check error:', error);
    window.location.href = "/index.html";
  }
}
checkLogin();

document.getElementById("logoutBtn").addEventListener("click", () => {
  window.location.href = `${API_BASE}/auth/logout`;
});

// Helper function to manage loading states
function setLoadingState(buttonId, show, text = null) {
  const loadingSpan = document.getElementById(buttonId + '-loading');
  const button = loadingSpan?.parentElement;
  
  if (loadingSpan && button) {
    if (show) {
      button.disabled = true;
      loadingSpan.style.display = 'inline-block';
      button.innerHTML = '<span class="loading" id="' + buttonId + '-loading"></span> Loading...';
    } else {
      button.disabled = false;
      loadingSpan.style.display = 'none';
      if (text) {
        // Reset to original button text
        const originalText = text;
        button.innerHTML = '<span class="loading" id="' + buttonId + '-loading" style="display:none;"></span> ' + originalText;
      }
    }
  }
}

// Fetch NASA - FIXED WITH LOADING SPINNER
async function fetchNASA() {
  try {
    console.log('🔄 Loading NASA...');
    setLoadingState('nasa', true);
    
    const res = await fetch(`${API_BASE}/api/proxy/nasa?count=5`);
    if (!res.ok) throw new Error(`NASA API error: ${res.status}`);
    
    const data = await res.json();
    currentData.nasa = Array.isArray(data) ? data : [data];
    
    document.getElementById("nasaResult").innerHTML = currentData.nasa.map(item =>
      `<div class="card">
        <h3>${item.title || 'No title'}</h3>
        <img src="${item.url || 'https://via.placeholder.com/300x200'}" 
             style="width:100%; border-radius:8px; height:200px; object-fit:cover;">
        <p>${item.explanation ? item.explanation.substring(0,150) + '...' : 'No description'}</p>
      </div>`).join("");
    
    console.log('✅ NASA loaded:', currentData.nasa.length, 'items');
    
  } catch (error) {
    console.error('NASA error:', error);
    document.getElementById("nasaResult").innerHTML = 
      '<div class="card" style="text-align:center; color:#666;"><p>🚀 NASA data temporarily unavailable</p></div>';
  } finally {
    setLoadingState('nasa', false, '🔄 Refresh NASA');
  }
}

// Fetch Weather - FIXED WITH LOADING SPINNER
async function fetchWeather() {
  try {
    console.log('🌤️ Loading Weather...');
    setLoadingState('weather', true);
    
    // Get city from input
    const cityElement = document.getElementById("cityInput");
    const city = cityElement ? cityElement.value.trim() || "London" : "London";
    
    console.log('🌐 Fetching weather for:', city);
    
    const res = await fetch(`${API_BASE}/api/proxy/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    
    const data = await res.json();
    
    // Check for OpenWeather error code
    if (data.cod && data.cod !== 200) {
      throw new Error(data.message || `Weather error for ${city}`);
    }
    
    currentData.weather = data;
    
    // Proper icon URL
    const iconCode = data.weather && data.weather[0] ? data.weather[0].icon : '01d';
    const icon = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    document.getElementById("weatherResult").innerHTML = `
      <div class="weather-card" style="text-align:center; padding:20px;">
        <h3 style="margin:0 0 10px 0;">${data.name}, ${data.sys.country}</h3>
        <img src="${icon}" alt="${data.weather[0].description}" style="width:80px; height:80px; margin:10px 0;">
        <p style="font-size:2.5em; margin:5px 0; font-weight:bold;">${Math.round(data.main.temp)}°C</p>
        <p style="margin:5px 0; text-transform:capitalize;">${data.weather[0].description}</p>
        <p style="margin:5px 0; font-size:0.9em; color:#666;">
          💧 ${data.main.humidity}% | 💨 ${data.wind.speed || 0} m/s
        </p>
      </div>
    `;
    
    console.log('✅ Weather loaded for:', city);
    
  } catch (error) {
    console.error('Weather error:', error);
    const city = document.getElementById("cityInput").value.trim() || "London";
    document.getElementById("weatherResult").innerHTML = 
      `<div class="weather-card" style="text-align:center; color:#e74c3c; padding:20px;">
        <p>🌤️ Error loading weather for "${city}"</p>
        <p style="font-size:0.9em; margin-top:10px; opacity:0.8;">${error.message}</p>
      </div>`;
  } finally {
    setLoadingState('weather', false, '🌤️ Get Weather');
  }
}

// Fetch News - FIXED WITH LOADING SPINNER
async function fetchNews() {
  try {
    console.log('📰 Loading News...');
    setLoadingState('news', true);
    
    const res = await fetch(`${API_BASE}/api/proxy/news`);
    if (!res.ok) throw new Error(`News API error: ${res.status}`);
    
    const responseData = await res.json();
    let articles = [];
    
    // Handle Spaceflight News API structure
    if (responseData.results && Array.isArray(responseData.results)) {
      articles = responseData.results;
    } else if (Array.isArray(responseData)) {
      articles = responseData;
    }
    
    currentData.news = articles;
    
    if (articles.length === 0) {
      document.getElementById("newsResult").innerHTML = 
        '<div class="card" style="text-align:center; color:#666; padding:40px;"><p>📰 No news articles available</p></div>';
      return;
    }
    
    const html = articles.slice(0, 5).map(article => {
      const imageUrl = article.image_url || article.image || 'https://picsum.photos/300/200?random=' + Math.random();
      const summary = (article.summary || article.description || '').substring(0, 120);
      const title = article.title || 'Untitled Article';
      const url = article.url || '#';
      
      return `
        <div class="card news-card" style="padding:15px; margin:5px;">
          <img src="${imageUrl}" 
               style="width:100%; height:150px; object-fit:cover; border-radius:8px;" 
               alt="News image"
               onerror="this.src='https://picsum.photos/300/200?random=${Math.random()}'">
          <h4 style="margin:10px 0 5px 0; font-size:1.1em;">${title}</h4>
          <p style="color:#666; font-size:0.9em; margin:0 0 10px 0; line-height:1.4;">${summary}...</p>
          <a href="${url}" target="_blank" 
             style="color:#0077ff; text-decoration:none; font-weight:500;">Read more →</a>
        </div>
      `;
    }).join("");
    
    document.getElementById("newsResult").innerHTML = html;
    console.log('✅ News loaded:', articles.length, 'articles');
    
  } catch (error) {
    console.error('News error:', error);
    document.getElementById("newsResult").innerHTML = 
      '<div class="card" style="text-align:center; color:#e74c3c; padding:40px;"><p>📰 News temporarily unavailable</p></div>';
  } finally {
    setLoadingState('news', false, '🔄 Refresh News');
  }
}

// SAVE RECORD - SIMPLIFIED
async function saveRecord(type) {
  console.log(`💾 Saving ${type}...`);
  
  // Check if we have data to save
  let saveData = {};
  let hasData = false;
  
  if ((type === 'all' || type === 'nasa') && currentData.nasa) {
    saveData.nasa = currentData.nasa;
    hasData = true;
  }
  if ((type === 'all' || type === 'weather') && currentData.weather) {
    saveData.weather = currentData.weather;
    hasData = true;
  }
  if ((type === 'all' || type === 'news') && currentData.news && currentData.news.length > 0) {
    saveData.news = currentData.news;
    hasData = true;
  }
  
  if (!hasData) {
    alert(`No ${type} data to save. Please load data first.`);
    return;
  }
  
  // Create simple payload
  const payload = {
    type: type,
    data: saveData,
    timestamp: new Date().toISOString()
  };
  
  console.log('📦 Saving:', Object.keys(saveData));
  
  try {
    const res = await fetch(`${API_BASE}/api/records`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const result = await res.json();
      alert(`✅ ${type.toUpperCase()} saved! ID: ${result._id}`);
      loadRecords();
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(`Error saving ${type}: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Save error:', error);
    alert(`Network error: ${error.message}`);
  }
}

// LOAD RECORDS
async function loadRecords() {
  try {
    console.log('📂 Loading records...');
    const res = await fetch(`${API_BASE}/api/records`, {
      headers: { "X-API-Key": API_KEY },
      credentials: "include"
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const records = await res.json();
    console.log(`📋 Loaded ${records.length} records`);
    
    if (records.length === 0) {
      document.getElementById("recordsList").innerHTML = 
        '<div style="text-align:center; padding:40px; color:#666;"><p>No saved records yet</p></div>';
      return;
    }
    
    const html = records.map(record => {
      const data = record.data || record;
      const nasaCount = data.nasa ? data.nasa.length : 0;
      const hasWeather = !!data.weather;
      const newsCount = data.news ? data.news.length : 0;
      
      return `
        <div class="record" style="margin:10px 0; padding:15px; background:#f9f9f9; border-radius:8px;">
          <h4>Saved: ${new Date(record.createdAt).toLocaleString()}</h4>
          <div style="display:flex; gap:10px; margin:10px 0; flex-wrap:wrap;">
            ${nasaCount ? `<span style="background:#3498db; color:white; padding:4px 8px; border-radius:4px;">🌌 ${nasaCount}</span>` : ''}
            ${hasWeather ? `<span style="background:#2ecc71; color:white; padding:4px 8px; border-radius:4px;">🌤️ Weather</span>` : ''}
            ${newsCount ? `<span style="background:#e74c3c; color:white; padding:4px 8px; border-radius:4px;">📰 ${newsCount}</span>` : ''}
          </div>
          <button onclick='deleteRecord("${record._id}")' style="background:red; color:white; margin-right:10px;">Delete</button>
          <button onclick='editRecord("${record._id}", ${JSON.stringify(JSON.stringify(record.data || record))})' style="background:#0077ff; color:white;">Edit</button>
        </div>
      `;
    }).join("");
    
    document.getElementById("recordsList").innerHTML = html;
  } catch (error) {
    console.error('Load records error:', error);
    document.getElementById("recordsList").innerHTML = '<p style="color:red;">Error loading records</p>';
  }
}

async function deleteRecord(id) {
  try {
    console.log('🗑️ Deleting record:', id);
    const res = await fetch(`${API_BASE}/api/records/${id}`, {
      method: "DELETE",
      headers: { "X-API-Key": API_KEY },
      credentials: "include"
    });
    if (res.ok) {
      loadRecords();
    } else {
      alert("Error deleting");
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert("Error deleting: " + error.message);
  }
}

// Edit functions - FIXED
function editRecord(id, recordData) {
  editingRecordId = id;
  // ✅ FIXED: Only show the data field in the editor (not the full record)
  const dataToEdit = recordData.data || recordData;
  document.getElementById('editContent').value = JSON.stringify(dataToEdit, null, 2);
  document.getElementById('editModal').style.display = 'flex';
}

function closeEdit() {
  editingRecordId = null;
  document.getElementById('editModal').style.display = 'none';
}

// ✅ FIXED: UPDATE BUTTON - Now sends proper data structure
document.getElementById('saveEditBtn').addEventListener('click', async () => {
  if (!editingRecordId) return;
  
  let parsedData;
  try {
    // Parse the JSON from the textarea
    const rawInput = document.getElementById('editContent').value;
    parsedData = JSON.parse(rawInput);
    
    // ✅ FIXED: Create proper payload structure for server
    const updatePayload = {
      data: parsedData,  // The edited data goes in the 'data' field
      format: 'structured'  // Default format
    };
    
    console.log('📝 Updating with payload:', updatePayload);
    
  } catch (e) {
    return alert('❌ Invalid JSON: ' + e.message);
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/records/${editingRecordId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json', 
        "X-API-Key": API_KEY 
      },
      // ✅ FIXED: Send the properly structured payload
      body: JSON.stringify(updatePayload)
    });
    
    if (res.ok) {
      const result = await res.json();
      alert(`✅ Record updated successfully! ID: ${result._id}`);
      closeEdit();
      loadRecords();
    } else {
      // ✅ IMPROVED: Better error handling
      const errorData = await res.json().catch(() => ({}));
      console.error('Server error response:', errorData);
      alert(`❌ Update failed: ${errorData.message || 'Unknown server error'}`);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert(`❌ Network error: ${error.message}`);
  }
});

window.onclick = (e) => {
  if (e.target.classList.contains('modal')) closeEdit();
};

// Auto-load
window.addEventListener('load', () => {
  console.log('🚀 Dashboard loaded');
  fetchNASA();
  fetchWeather();
  fetchNews();
  loadRecords();
});