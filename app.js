(() => {
  const STORIES_KEY = 'golpokotha_stories_v1';
  const REACTIONS_KEY = 'golpokotha_reactions_v1';
  const COMMENTS_KEY = 'golpokotha_comments_v1';
  const $ = (s, root=document) => root.querySelector(s);
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  let stories = read(STORIES_KEY, []);
  let reactions = read(REACTIONS_KEY, {});
  let comments = read(COMMENTS_KEY, {});
  let activeFilter = 'সব গল্প';
  const bn = n => new Intl.NumberFormat('bn-BD').format(n);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save = () => { localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions)); localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments)); };
  const icons = ['📚','🌷','🌙','🪶','🦋','✨','🌼'];
  const getReaction = id => reactions[id] || {like:false, dislike:false};
  function render() {
    stories = read(STORIES_KEY, []);
    const query = $('#searchInput').value.trim().toLocaleLowerCase('bn');
    const list = stories.filter(s => s.published !== false)
      .filter(s => activeFilter === 'সব গল্প' || s.type === activeFilter || (activeFilter === 'অন্যান্য' && !['রোমান্টিক','রহস্য','ভৌতিক','অনুপ্রেরণামূলক'].includes(s.type)))
      .filter(s => !query || [s.title,s.writer,s.type,s.content,s.part].join(' ').toLocaleLowerCase('bn').includes(query))
      .sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
    $('#storyCount').textContent = `${bn(list.length)}টি গল্প`;
    $('#feedTitle').textContent = query ? 'খোঁজার ফলাফল' : activeFilter === 'সব গল্প' ? 'সবার গল্প' : activeFilter;
    $('#storyFeed').innerHTML = list.map((s,i) => card(s,i)).join('');
    $('#emptyState').hidden = list.length > 0;
    $('#emptyTitle').textContent = query ? 'কোনো গল্প পাওয়া যায়নি' : stories.filter(s=>s.published!==false).length ? 'এই বিভাগে গল্প নেই' : 'এখনো কোনো গল্প প্রকাশিত হয়নি';
    $('#emptyText').textContent = query ? 'অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন।' : 'অ্যাডমিন গল্প প্রকাশ করলে এখানে দেখা যাবে। আবার পরে ঘুরে আসুন!';
    $('#year').textContent = new Date().getFullYear();
  }
  function card(s,i) {
    const id = esc(s.id), r = getReaction(s.id), cs = comments[s.id] || [];
    const long = (s.content || '').length > 720;
    const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString('bn-BD',{day:'numeric',month:'short',year:'numeric'}) : '';
    return `<article class="story-card" id="story-${id}">
      <div class="story-head"><div class="avatar">${icons[i%icons.length]}</div><div class="story-meta"><strong>${esc(s.writer || 'অজ্ঞাত লেখক')}</strong><small>${date} ${s.part ? ' · '+esc(s.part):''}</small></div><span class="type-pill">${esc(s.type || 'অন্যান্য')}</span></div>
      <h3 class="story-title">${esc(s.title)}</h3><p class="story-subtitle">✦ গল্পকথার গল্পসংগ্রহ</p>
      <div class="story-content ${long?'collapsed':''}" id="content-${id}">${esc(s.content)}</div>
      ${long?`<button class="see-more" data-more="${id}">আরও পড়ুন ↓</button>`:''}
      <div class="story-actions"><button class="action-btn ${r.like?'selected':''}" data-react="like" data-id="${id}">💜 লাইক <span>${bn(r.likeCount||0)}</span></button><button class="action-btn ${r.dislike?'disliked':''}" data-react="dislike" data-id="${id}">👎 অপছন্দ <span>${bn(r.dislikeCount||0)}</span></button><button class="action-btn" data-comments="${id}">💬 মন্তব্য <span>${bn(cs.length)}</span></button></div>
      <section class="comments" id="comments-${id}"><h4>পাঠকের মন্তব্য (${bn(cs.length)})</h4>
      <form class="comment-form" data-comment-form="${id}"><input name="name" maxlength="45" placeholder="আপনার নাম" aria-label="আপনার নাম" required><input name="text" maxlength="800" placeholder="মতামত লিখুন..." aria-label="মন্তব্য লিখুন" required><button type="submit">পাঠান</button></form>
      <div>${cs.length?cs.map((c,j)=>`<div class="comment"><div class="comment-avatar">☺</div><div class="comment-body"><strong>${esc(c.name)}</strong><p>${esc(c.text)}</p></div><button class="delete-comment" title="মন্তব্য মুছুন" data-delete-comment="${id}" data-index="${j}">মুছুন</button></div>`).join(''):'<p class="no-comments">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!</p>'}</div></section></article>`;
  }
  $('#searchInput').addEventListener('input', render);
  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => { activeFilter=b.dataset.filter; document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===b)); render(); }));
  $('#storyFeed').addEventListener('click', e => {
    const more = e.target.closest('[data-more]');
    if(more){ const el=$(`#content-${CSS.escape(more.dataset.more)}`); const collapsed=el.classList.toggle('collapsed'); more.textContent=collapsed?'আরও পড়ুন ↓':'কম দেখুন ↑'; return; }
    const react = e.target.closest('[data-react]');
    if(react){ const id=react.dataset.id, type=react.dataset.react; const r=getReaction(id); const countKey=type==='like'?'likeCount':'dislikeCount'; if(r[type]){r[type]=false;r[countKey]=Math.max(0,(r[countKey]||0)-1)}else{if(r[type==='like'?'dislike':'like']){const other=type==='like'?'dislike':'like';r[other]=false;r[other+'Count']=Math.max(0,(r[other+'Count']||0)-1)}r[type]=true;r[countKey]=(r[countKey]||0)+1} reactions[id]=r;save();render();return; }
    const c = e.target.closest('[data-comments]'); if(c){$(`#comments-${CSS.escape(c.dataset.comments)}`).scrollIntoView({behavior:'smooth',block:'center'});}
    const del=e.target.closest('[data-delete-comment]'); if(del){const id=del.dataset.deleteComment,idx=Number(del.dataset.index);if(confirm('এই মন্তব্যটি মুছে ফেলবেন?')){comments[id]=(comments[id]||[]).filter((_,i)=>i!==idx);save();render();}}
  });
  $('#storyFeed').addEventListener('submit', e => {const form=e.target.closest('[data-comment-form]');if(!form)return;e.preventDefault();const fd=new FormData(form),name=String(fd.get('name')||'').trim(),text=String(fd.get('text')||'').trim(),id=form.dataset.commentForm;if(!name||!text)return;comments[id]=comments[id]||[];comments[id].push({name,text,createdAt:Date.now()});save();render();});
  window.addEventListener('storage', e => {if([STORIES_KEY,COMMENTS_KEY,REACTIONS_KEY].includes(e.key))render();});
  render();
})();