function fetchWithTimeout(url, opts, timeout) {
  return new Promise(function(resolve, reject) {
    var ctrl = new AbortController();
    var timer = setTimeout(function() { ctrl.abort(); }, timeout || 15000);
    opts.signal = ctrl.signal;
    fetch(url, opts).then(function(res) {
      clearTimeout(timer);
      resolve(res);
    }).catch(function(err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') reject(new Error('انتهت مهلة الاتصال'));
      else reject(err);
    });
  });
}

const API = {
  async request(method, path, data) {
    const opts = { method, headers: {} };
    if (data instanceof FormData) {
      opts.body = data;
    } else if (data) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
    const res = await fetchWithTimeout(path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  },

  get(path) { return this.request('GET', path); },
  post(path, data) { return this.request('POST', path, data); },
  put(path, data) { return this.request('PUT', path, data); },
  del(path) { return this.request('DELETE', path); },

  async formPost(path, formData) {
    const res = await fetchWithTimeout(path, { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  },

  async formPut(path, formData) {
    const res = await fetchWithTimeout(path, { method: 'PUT', body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'حدث خطأ');
    return json;
  }
};
