/**
 * 本地存储实现,封装localStorage, sessionStorage, cookie
 */
let store = {
  version: __VERSION__,
  storage: window.localStorage,
  session: {
    storage: window.sessionStorage
  },
  cookie: {
    cookie: document.cookie
  }
}

/* eslint-disable */
const cookieApi = {
  /**
   * 创建或覆盖一个cookie
   * @param key 要创建或覆盖的cookie的名字 (string)
   * @param value cookie的值 (string)
   * @param [end] 最大年龄的秒数 (一年为31536e3， 永不过期的cookie为Infinity)
   * @param [path] 例如 '/', '/mydir'。 如果没有定义，默认为当前文档位置的路径。(string or null)。路径必须为绝对路径
   * @param [domain] 例如 'example.com'， '.example.com' (包括所有子域名), 'subdomain.example.com'。如果没有定义，默认为当前文档位置的路径的域名部分 (string或null)
   * @param [secure] cookie只会被https传输 (boolean或null)
   * @returns {boolean}
   */
  set(key, value, end, path, domain, secure) {
    if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) {
      return false;
    }
    let sExpires = '';
    if (end) {
      switch (end.constructor) {
        case Number:
          sExpires = end === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + end;
          break;
        case String:
          sExpires = '; expires=' + end;
          break;
        case Date:
          sExpires = '; expires=' + end.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + sExpires + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '') + (secure ? '; secure' : '');
    return true;
  },
  /**
   * 读取一个cookie。如果cookie不存在返回null
   * @param key 读取的cookie名 (string)
   * @returns {string|null}
   */
  get(key) {
    return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
  },
  /**
   * 检查一个cookie是否存在
   * @param key
   * @returns {boolean}
   */
  has(key) {
    return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
  },
  /**
   * 删除一个cookie
   * @param key 要移除的cookie名(string)
   * @param path
   * @param domain
   * @returns {boolean}
   */
  remove(key, path, domain) {
    if (!key || !this.has(key)) {
      return false;
    }
    document.cookie = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '');
    return true;
  },
  /**
   * 返回一个这个路径所有可读的cookie的数组
   * @returns {Array}
   */
  keys() {
    let aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
    for (let nIdx = 0; nIdx < aKeys.length; nIdx++) {
      aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
    }
    return aKeys;
  }
}

const api = {
  set(key, val) {
    if (this.disabled) {
      return
    }
    if (val === undefined) {
      return this.remove(key)
    }
    this.storage.setItem(key, serialize(val))
    return val
  },

  get(key, def) {
    if (this.disabled) {
      return def
    }
    let val = deserialize(this.storage.getItem(key))
    return (val === undefined ? def : val)
  },

  has(key) {
    return this.get(key) !== undefined
  },

  remove(key) {
    if (this.disabled) {
      return
    }
    this.storage.removeItem(key)
  },

  clear() {
    if (this.disabled) {
      return
    }
    this.storage.clear()
  },

  getAll() {
    if (this.disabled) {
      return null
    }
    let ret = {}
    this.forEach((key, val) => {
      ret[key] = val
    })
    return ret
  },

  forEach(callback) {
    if (this.disabled) {
      return
    }
    for (let i = 0; i < this.storage.length; i++) {
      let key = this.storage.key(i)
      callback(key, this.get(key))
    }
  }
}

Object.assign(store, api)

Object.assign(store.session, api)

Object.assign(store.cookie, cookieApi)

function serialize(val) {
  return JSON.stringify(val)
}

function deserialize(val) {
  if (typeof val !== 'string') {
    return undefined
  }
  try {
    return JSON.parse(val)
  } catch (e) {
    return val || undefined
  }
}

try {
  const testKey = '__storejs__'
  store.set(testKey, testKey)
  if (store.get(testKey) !== testKey) {
    store.disabled = true
  }
  store.remove(testKey)
} catch (e) {
  store.disabled = true
}

export default store
