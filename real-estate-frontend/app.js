const API = "http://localhost:5000/api";
let token = localStorage.getItem("estateToken");

const $ = id => document.getElementById(id);

function authHeaders(json=false){
  const h = {};
  if(json) h["Content-Type"]="application/json";
  if(token) h["Authorization"]=`Bearer ${token}`;
  return h;
}

function setStatus(msg){ $("status").textContent=msg||""; }

function money(n){
  return n == null ? "Price on request" : "₹" + Number(n).toLocaleString("en-IN");
}

async function loadProperties(){
  setStatus("Loading properties...");
  const params = new URLSearchParams();
  if($("city").value) params.set("city",$("city").value);
  if($("propertyType").value) params.set("propertyType",$("propertyType").value);
  if($("minPrice").value) params.set("minPrice",$("minPrice").value);
  if($("maxPrice").value) params.set("maxPrice",$("maxPrice").value);
  params.set("limit","12");
  try{
    const res = await fetch(`${API}/properties/search?${params}`, {headers:authHeaders()});
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Could not load properties");
    const list = data.data?.properties || [];
    $("propertyGrid").innerHTML = list.length ? list.map(p => `
      <article class="card">
        <div class="card-img">PROPERTY IMAGE</div>
        <div class="card-body">
          <h3>${escapeHtml(p.title || "Property")}</h3>
          <div class="price">${money(p.price)}</div>
          <div class="meta">${escapeHtml(p.city || "")} ${p.locality ? "• "+escapeHtml(p.locality):""}</div>
          <div class="meta">${p.bedrooms ?? "-"} Bedrooms • ${p.bathrooms ?? "-"} Bathrooms • ${p.areaSqft ?? "-"} sq.ft</div>
          <div class="card-actions">
            <button class="outline" onclick="showDetail('${p._id}')">Details</button>
            <button class="primary" onclick="favourite('${p._id}')">♥ Save</button>
          </div>
        </div>
      </article>`).join("") : `<div>No verified properties found.</div>`;
    setStatus(`${list.length} verified property${list.length===1?"":"ies"} found.`);
  }catch(e){ setStatus(e.message); $("propertyGrid").innerHTML=""; }
}

async function showDetail(id){
  $("detailContent").innerHTML="<p>Loading...</p>";
  $("detailModal").classList.remove("hidden");
  try{
    const res=await fetch(`${API}/properties/${id}`,{headers:authHeaders()});
    const data=await res.json();
    if(!res.ok) throw new Error(data.message||"Unable to load property");
    const p=data.data?.property;
    $("detailContent").innerHTML=`
      <p class="eyebrow">PROPERTY DETAILS</p>
      <h2>${escapeHtml(p.title||"Property")}</h2>
      <div class="detail-price">${money(p.price)}</div>
      <p>${escapeHtml(p.description||"No description available.")}</p>
      <div class="detail-grid">
        <div class="detail-item"><b>City</b><br>${escapeHtml(p.city||"-")}</div>
        <div class="detail-item"><b>Locality</b><br>${escapeHtml(p.locality||"-")}</div>
        <div class="detail-item"><b>Bedrooms</b><br>${p.bedrooms??"-"}</div>
        <div class="detail-item"><b>Bathrooms</b><br>${p.bathrooms??"-"}</div>
        <div class="detail-item"><b>Area</b><br>${p.areaSqft??"-"} sq.ft</div>
        <div class="detail-item"><b>Status</b><br>${escapeHtml(p.status||"-")}</div>
      </div>
      <div class="enquiry">
        <h3>Send an Enquiry</h3>
        <textarea id="enquiryText" placeholder="I am interested in this property..."></textarea>
        <button class="primary full" onclick="submitEnquiry('${p._id}')">Submit Enquiry</button>
        <div id="enquiryMessage" class="message"></div>
      </div>`;
  }catch(e){ $("detailContent").innerHTML=`<p>${escapeHtml(e.message)}</p>`; }
}

async function submitEnquiry(id){
  if(!token){ openModal(); $("loginMessage").textContent="Please login first."; return; }
  const message=$("enquiryText").value.trim();
  if(!message){$("enquiryMessage").textContent="Please enter a message.";return;}
  try{
    const res=await fetch(`${API}/enquiries`,{method:"POST",headers:authHeaders(true),body:JSON.stringify({propertyId:id,message})});
    const data=await res.json();
    $("enquiryMessage").textContent=data.message || (res.ok?"Enquiry submitted":"Failed");
  }catch(e){$("enquiryMessage").textContent=e.message;}
}

async function favourite(id){
  if(!token){openModal();$("loginMessage").textContent="Please login to save favourites.";return;}
  try{
    const res=await fetch(`${API}/favourites`,{method:"POST",headers:authHeaders(true),body:JSON.stringify({propertyId:id})});
    const data=await res.json();
    alert(data.message || "Done");
  }catch(e){alert(e.message);}
}

async function login(){
  const msg=$("loginMessage"); msg.textContent="Logging in...";
  try{
    const res=await fetch(`${API}/auth/login`,{method:"POST",headers:authHeaders(true),body:JSON.stringify({email:$("email").value,password:$("password").value})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.message||"Login failed");
    token=data.data?.token; localStorage.setItem("estateToken",token);
    $("loginModal").classList.add("hidden"); updateNav(); msg.textContent="";
    alert("Login successful!");
  }catch(e){msg.textContent=e.message;}
}

function updateNav(){
  $("loginBtn").classList.toggle("hidden",!!token);
  $("logoutBtn").classList.toggle("hidden",!token);
}
function openModal(){$("loginModal").classList.remove("hidden")}
function closeModal(){$("loginModal").classList.add("hidden")}
function closeDetail(){$("detailModal").classList.add("hidden")}
function logout(){token=null;localStorage.removeItem("estateToken");updateNav();alert("Logged out");}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

$("searchBtn").onclick=loadProperties;
$("refreshBtn").onclick=loadProperties;
$("loginBtn").onclick=openModal;
$("logoutBtn").onclick=logout;
$("doLogin").onclick=login;
updateNav();
loadProperties();
