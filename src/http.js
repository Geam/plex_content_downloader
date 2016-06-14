var exports = module.exports = {};

exports.fEncodeArgs = (sMethod, oArgs) => {
  // get type of stuff
  const fWhat = Object.prototype.toString;

  var fEncodeOne = (sKey, sId, sData) => {
    return sKey + "[" + sId + "]=" + encodeURIComponent(sData);
  };

  // encode arg depending if it string, array or object
  const fEncodeArgsSub = (sKey, uValue) => {
    switch(fWhat.call(uValue)) {
      case "[object Array]":
        return uValue.reduce((sPrev, sCur, iIdx) => {
          return sPrev + (iIdx > 0 ? "&" : "") + fEncodeOne(sKey, iIdx, sCur);
        }, "");
      case "[object Object]":
        return Object.keys(uValue).reduce((sPrev, sCur, iIdx) => {
          return sPrev + (iIdx > 0 ? "&" : "") + fEncodeOne(sKey, sCur, uValue[sCur]);
        }, "");
      default:
        return sKey + "=" + encodeURIComponent(uValue);
    }
  };

  // create string from arg
  var sArgs = Object.keys(oArgs).reduce((sPrev, sCur, iIdx) => {
    return sPrev + (iIdx > 0 ? "&" : "") + fEncodeArgsSub(sCur, oArgs[sCur]);
  }, "");

  // return depending on type
  if (sMethod === "POST") { return sArgs.replace(/%20/g, "+"); }
  else if (sMethod === "GET") { return "?" + sArgs; }
  return sArgs;
};

exports.fRequest = (sUrl, oHeaders) => {
  const fAjax = (sMethod, sUrl, oHeaders, oArgs) => {
    var promise = new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      var sUri = sUrl;
      var sSendArgs = null;

      if (oArgs) {
        if (sMethod === "GET") {
          sUri += exports.fEncodeArgs(sMethod, oArgs);
        } else if (sMethod === "POST") {
          sSendArgs = exports.fEncodeArgs(sMethod, oArgs);
        }
      }

      req.open(sMethod, sUri);

      if (oHeaders) {
        Object.keys(oHeaders).forEach((sValue, iIdx) => {
          req.setRequestHeader(sValue, oHeaders[sValue]);
        });
      }
      if (sMethod === "POST") {
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      }

      req.onload = () => {
        if (req.status >= 200 && req.status < 300) {
          resolve(req);
        } else {
          reject(req);
        }
      };
      req.onerror = () => {
        reject(req);
      };
      req.send(sSendArgs);
    });
    return promise;
  };

  return {
    get: (oArgs) => {
      return fAjax("GET", sUrl, oHeaders, oArgs);
    },
    post: (oArgs) => {
      return fAjax("POST", sUrl, oHeaders, oArgs);
    }
  };
};
