const API = {
  async request(method, path, data) {
    const opts = { method, headers: {} };
    if (data instanceof FormData) {
      opts.body = data;
    } else if (data) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
    const res = await fetch(path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  },

  get(path) { return this.request('GET', path); },
  post(path, data) { return this.request('POST', path, data); },
  put(path, data) { return this.request('PUT', path, data); },
  del(path) { return this.request('DELETE', path); },

  async formPost(path, formData) {
    const res = await fetch(path, { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  },

  async formPut(path, formData) {
    const res = await fetch(path, { method: 'PUT', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  }
};
