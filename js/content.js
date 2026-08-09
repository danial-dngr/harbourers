
window.HARBOURER_CONTENT = {
  async load() {
    const r = await fetch('content/projects.json', {cache:'no-store'});
    if (!r.ok) throw new Error('Could not load content/projects.json');
    return r.json();
  }
};
