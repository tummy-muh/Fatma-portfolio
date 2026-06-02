// ─── Render backend URL ───────────────────────────────────────────────────────
// This is your live Render service URL. Update if it ever changes.
const API_BASE = "https://fatma-portfolio.onrender.com";

// ===== Neuron animated background =====
(function(){
  const c = document.getElementById('neuron-bg'); if(!c) return;
  const ctx = c.getContext('2d');
  let w, h, nodes=[];
  const COUNT = Math.min(90, Math.floor(window.innerWidth/16));
  const LINK = 140;
  function resize(){ w=c.width=innerWidth*devicePixelRatio; h=c.height=innerHeight*devicePixelRatio; c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px'; }
  function init(){ nodes=[]; for(let i=0;i<COUNT;i++) nodes.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4*devicePixelRatio,vy:(Math.random()-.5)*.4*devicePixelRatio,r:(1.4+Math.random()*1.8)*devicePixelRatio}); }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const n of nodes){ n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>w)n.vx*=-1; if(n.y<0||n.y>h)n.vy*=-1; }
    const linkPx = LINK*devicePixelRatio;
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i], b=nodes[j], dx=a.x-b.x, dy=a.y-b.y, d=Math.hypot(dx,dy);
        if(d<linkPx){ const al=(1-d/linkPx)*.4; ctx.strokeStyle=`rgba(124,45,92,${al})`; ctx.lineWidth=devicePixelRatio*.6; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
      ctx.fillStyle='rgba(124,45,92,.5)'; ctx.beginPath(); ctx.arc(nodes[i].x,nodes[i].y,nodes[i].r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  resize(); init(); tick();
  addEventListener('resize',()=>{resize();init();});
})();

// ===== Navbar shadow on scroll =====
window.addEventListener('scroll', ()=>{
  document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 20);
}, {passive:true});

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ===== Skill bars =====
const sio = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.skill-fill').forEach(f=>{ f.style.width = f.dataset.pct + '%'; });
      sio.unobserve(e.target);
    }
  });
},{threshold:.2});
document.querySelectorAll('#skills-section').forEach(el=>sio.observe(el));

// ===== Scrollspy =====
const sections = ['section_1','about-section','section_3','skills-section','section_4','contact'].map(id=>document.getElementById(id)).filter(Boolean);
const navLinks = document.querySelectorAll('.navbar-nav .nav-link.click-scroll');
function onScroll(){
  const scrollY = window.scrollY + 120;
  let activeIdx = 0;
  sections.forEach((s,i)=>{ if(s && s.offsetTop <= scrollY) activeIdx = i; });
  navLinks.forEach((l,i)=> l.classList.toggle('active', i===activeIdx));
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

// Smooth click-scroll
document.querySelectorAll('.click-scroll').forEach(a=>{
  a.addEventListener('click', e=>{
    const href = a.getAttribute('href'); if(!href || !href.startsWith('#')) return;
    const tgt = document.querySelector(href); if(!tgt) return;
    e.preventDefault();
    window.scrollTo({top: tgt.offsetTop - 80, behavior:'smooth'});
    document.getElementById('nav')?.classList.remove('show');
  });
});

// ===== Footer year =====
const yr = document.getElementById('year'); if(yr) yr.textContent = new Date().getFullYear();

// ===== Contact form — calls Render backend via fetch =====
const form = document.getElementById('contactForm');
if(form){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const btn    = form.querySelector('button[type="submit"]');
    const status = document.getElementById('formStatus');

    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const subject = (form.querySelector('[name="subject"]')?.value.trim()) || '(No subject)';
    const message = form.querySelector('[name="message"]').value.trim();

    // Client-side validation
    if(!name || !email || !message){
      status.textContent = '✗ Please fill in all required fields.';
      status.style.color = '#c0392b';
      return;
    }

    // Disable button and show spinner
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending…';
    status.textContent = '';

    try{
      const res = await fetch(`${API_BASE}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if(res.ok && data.ok){
        status.textContent = '✓ Message sent! I\'ll reply within 24 hours.';
        status.style.color = 'var(--berry, #7C2D5C)';
        form.reset();
      } else {
        // Server returned an error payload
        const detail = data.detail || 'Something went wrong. Please try again.';
        status.textContent = `✗ ${detail}`;
        status.style.color = '#c0392b';
      }
    } catch(err){
      console.error('Contact form error:', err);
      status.textContent = '✗ Could not reach the server. Please email me directly at fatma.muhsin2023@gmail.com';
      status.style.color = '#c0392b';
    } finally{
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-1"></i> Send Message';
    }
  });
}
