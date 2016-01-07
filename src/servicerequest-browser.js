function makeUrl(uri, qs) {
  // create full query string
  let end_url = '';
  if (Array.isArray(uri)) {
    end_url += uri.join('/');
  } else {
    end_url += uri;
  }
  let qstring;
  if (!qs) {
    qstring = '';
  } if (typeof qs === 'string') {
    qstring = '?' + qs;
  } else {
    let qparams = [];
    for (let pname in qs) {
      if (Array.isArray(qs[pname])) {
        for (let j = 0; j < qs[pname].length; j++) {
          qparams.push(pname + '=' + encodeURIComponent(qs[pname][j]));
        }
      } else if (qs[pname]) {
        qparams.push(pname + '=' + encodeURIComponent(qs[pname]));
      } else if (qs[pname] === null) {
        qparams.push(pname);
      }
    }
    qstring = '?' + qparams.join('&');
  }
  return end_url + qstring;
}

/**
  * send a REST request to the service
  *
  * @param {string} method the http method ('GET','POST','PUT' or 'DELETE')
  * @param {string} uri the request URI
  * @param {string|object} qs the query string parameters
  * @param {function(error,outcome)} callback
  */
export default function service_request(method, uri, qs, callback) {
  if (typeof qs === 'function' && !callback) {
    callback = qs;
    qs = {};
  }
  let end_url = makeUrl(uri, qs);
  // This XDomainRequest thing is for IE support (lulz)
  let req = (typeof XDomainRequest !== 'undefined') ? new XDomainRequest() : new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      let error = null;
      if (req.status !== 200) {
        error = {
          code: "SERVER-"+req.status,
          message: req.statusText
        };
      }
      let type = req.getResponseHeader('Content-Type');
      let mime = type || "";
      if (mime.indexOf(";") !== -1) {
        mime = mime.split(";")[0];
      }
      let result;
      if (mime === 'application/json') {
        result = JSON.parse(req.responseText);
      } else if (mime.startsWith('text')) {
        result = req.responseText;
      } else {
        result = { type, text: req.responseText };
      }
      callback(error, result);
    }
  };
  req.open(method, end_url, true);
  req.send();
}
