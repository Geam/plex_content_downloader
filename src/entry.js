"use strict";

require("./css/main.css");

const fEncodeArgs = (sMethod, oArgs) => {
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
}

const $http = (sUrl, oHeaders) => {
  const fAjax = (sMethod, sUrl, oHeaders, oArgs) => {
    var promise = new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      var sUri = sUrl;
      var sSendArgs = null;

      if (oArgs) {
        if (sMethod === "GET") {
          sUri += fEncodeArgs(sMethod, oArgs);
        } else if (sMethod === "POST") {
          sSendArgs = fEncodeArgs(sMethod, oArgs);
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

const oPlexUrl = {
  sAuth: "https://plex.tv/users/sign_in.json",
  sPms: "https://plex.tv/api/resources?includeHttps=1",
  sSections: "/library/sections/",
  sSearch: "/search"
};

const oStrings = {
  en: {
    topBar: {
      connect: "Connexion",
      disconnect: "Logout",
      login: "Login",
      password: "Password",
      all: "All",
    },
    content: {
      mediaType: {
        movie: "Movie",
        show: "Show",
        season: "Season",
        episode: "Episode",
        trailer: "Trailer",
        comic: "Comic",
        person: "Person",
        artist: "Artist",
        album: "Album",
        track: "Track",
        photoAlbum: "Photo Album",
        picture: "Picture",
        photo: "Photo",
        clip: "Clip",
        playlistItem: "PlayList"
      }
    }
  }
};

var oPlexHeaders = {
  "Accept": "application/json",
  "X-Plex-Product": "Plex Downloader",
  "X-Plex-Version": "1",
  "X-Plex-Client-Identifier": "28d88c58"
};
var aServer = [];
var oDraw = {};

var fDraw = (oStrings) => {
  const fAddContent = (el, content) => {
    if (typeof el === "string")
      el = document.querySelector(el);
    if (!(el instanceof Element)) { return }
    if (typeof content === "string") {
      el.appendChild(document.createTextNode(content));
    } else if (Array.isArray(content)) {
      content.forEach((subContent) => {
        fAddContent(el, subContent);
      });
    } else if (content instanceof Element) {
      el.appendChild(content);
    }
  };
  const fNewEl = (tag, attrs, content) => {
    var el = document.createElement(tag);
    Object.keys(attrs).forEach((key) => {
      el.setAttribute(key, attrs[key]);
    });
    fAddContent(el, content);
    return el;
  };
  const fDelEl = (el) => {
    if (typeof el === "string")
      el = document.querySelector(el);
    if (el instanceof Element) {
      while (el.firstChild) {
        if (el.firstChild instanceof Element)
          fDelEl(el.firstChild);
        el.removeChild(el.firstChild);
      }
    }
  };

  return {
    fInit: () => {
      fAddContent("body", [
          fNewEl("div", { id: "topBar" }, [
            fNewEl("div", { id: "controlDiv", class: "topBar-cont" }, null),
            fNewEl("div", { id: "loginInfo", class: "topBar-cont" }, [
              fNewEl("div", { id: "connectDiv", class: "topBar-elem" }, [
                fNewEl("input", { id: "plexLogin", class: "topBar-elem", placeholder: oStrings.topBar.login, type: "text" }, null),
                fNewEl("input", { id: "plexPassword", class: "topBar-elem", placeholder: oStrings.topBar.password, type: "password" }, null),
                fNewEl("button", { id: "plexSendLogin", class: "topBar-elem plexButton", type: "button" }, oStrings.topBar.connect)
              ]),
              fNewEl("div", { id: "connectedDiv", class: "topBar-elem", hidden: "true" }, [
                fNewEl("button", { id: "plexDisconnect", class: "topBar-elem plexButton", type: "button" }, oStrings.topBar.disconnect)
              ])
            ])
          ]),
          fNewEl("div", { id: "content" }, null)
      ]);
    },
    fControllBar: () => {
      fAddContent("#controlDiv", [
        fNewEl("label", { class: "dropdown topBar-margin" },
          fNewEl("select", { id: "serverSelector", name: "serverSelector", class: "topBar-elem" }, aServer.reduce((aPrev, oCur, iIdx) => {
            return aPrev.concat(fNewEl("option", { value: iIdx }, oCur.name));
          }, []))
        ),
        fNewEl("div", { id: "searchDiv", class: "topBar-elem topBar-margin" }, [
          fNewEl("span", { class: "icon-magnifier topBar-margin", style: "font-size: 12px;" }, ""),
          fNewEl("input", { id: "searchInput", name: "searchInput", type: "sarch", class: "topBar-elem topBar-margin" }, "")
        ]),
        fNewEl("label", { class: "dropdown" },
          fNewEl("select", { id: "searchTypeSelector", name: "searchTypeSelector", class: "topBar-elem" },
            Object.keys(oStrings.content.mediaType).reduce((aPrev, sCur, iIdx) => {
              return aPrev.concat(fNewEl("option", { value: iIdx + 1 }, oStrings.content.mediaType[sCur]));
            }, [fNewEl("option", { value: 0 }, oStrings.topBar.all)])
          )
        )
      ]);
    },
    fDisconnect: () => {
      fDelEl("#controlDiv");
      fDelEl("#content");
    },
    fSearchInit: () => {
      fDelEl("#content");
    },
    fSearch: (oRes) => {
      const drawElement = (oElement) => {
        if (!oElement.librarySectionID) { return ; }
        var parentDiv = document.getElementById("res-" + oElement.type + "-content");
        if (!(parentDiv instanceof Element)) {
          fAddContent("#content",
            fNewEl("div", { id: "res-" + oElement.type }, [
              fNewEl("div", { class: "sectionTitle" }, oStrings.content.mediaType[oElement.type]),
              fNewEl("div", { id: "res-" + oElement.type + "-content", class: "sectionContainer"}, null)
            ])
          );
          parentDiv = document.getElementById("res-" + oElement.type + "-content");
        }
        var fDrawType = {
          movie: (oMovie) => {
            return fNewEl("h2", {}, oMovie.title);
          },
          show: (oShow) => {
            return fNewEl("h2", {}, oShow.title);
          },
          season: (oSeason) => {
            return fNewEl("h2", {}, oSeason.title);
          },
          episode: (oEpisode) => {
            return fNewEl("h2", {}, oEpisode.title);
          },
          artist: (oArtist) => {
            return fNewEl("h2", {}, oArtist.title);
          },
          album: (oAlbum) => {
            return fNewEl("h2", {}, oAlbum.title);
          },
          track: (oTrack) => {
            return fNewEl("div", {}, [
              fNewEl("img", { src: oRes.uri + oTrack.thumb + oRes.accessToken, alt: oTrack.parentTile }, null),
              fNewEl("div", {}, [
                fNewEl("a", {}, oTrack.grandparentTitle),
                fNewEl("a", {}, oTrack.parentTitle),
                fNewEl("a", {}, oTrack.Title)
              ])
            ]);
          }
        };
        fAddContent(parentDiv, fDrawType[oElement.type](oElement));
      }
      oRes._children.forEach(drawElement);
    }
  }
};

var oXHRCallback = {
  fLogin: (oReq) => {
    var sAuthToken = JSON.parse(oReq.response).user.authentication_token;
    var oPlexPmsHeaders = Object.assign({}, oPlexHeaders);
    oPlexPmsHeaders["X-Plex-Token"] = sAuthToken;
    return $http(oPlexUrl.sPms, oPlexPmsHeaders).get();
  },
  fPms: (oReq) => {
    var pmsRes = xmlToJSON.parseString(oReq.response);
    pmsRes.MediaContainer[0].Device.forEach((oDevice) => {
      if (oDevice._attr.product._value === "Plex Media Server") {
        var oServer = {
          accessToken: oDevice._attr.accessToken._value,
          name: oDevice._attr.name._value,
          http: {}
        };
        oDevice.Connection.forEach((oConnection) => {
          if (!oConnection._attr.local._value) {
            oServer.uri = oConnection._attr.uri._value;
          }
        });
        var oHeader = Object.assign({}, oPlexHeaders);
        oHeader["X-Plex-Token"] = oDevice._attr.accessToken._value;
        oServer.http.search = $http(oServer.uri + oPlexUrl.sSearch, oHeader);
        oServer.http.sections = $http(oServer.uri + oPlexUrl.sSections, oHeader);
        aServer.push(oServer);
      }
    });
    if (aServer.length > 0) {
      document.getElementById("connectDiv").hidden = true;
      oDraw.fControllBar();
      document.getElementById("connectedDiv").hidden = false;
      document.getElementById("searchInput").onkeydown = oPlex.fSearch;
    }
    oPlex.fPmsSections();
  },
  fSearch: (oReq) => {
    var oData = JSON.parse(oReq.response);
    oData.uri = oReq.responseURL.substring(0, oReq.responseURL.search("/search"));
    oData.accessToken = aServer.reduce((sPrev, oServer) => {
      if (oServer.uri === oData.uri) {
        return fEncodeArgs("GET", { "X-Plex-Token": oServer.accessToken });
      }
      return sPrev;
    }, "");
    oDraw.fSearch(oData);
  },
  fSections: (oReq) => {
    var oData = JSON.parse(oReq.response);
    var oServer = aServer[document.querySelector("#serverSelector").value];
    oServer.lib = [];
    oData._children.forEach((oSection) => {
      oServer.lib[oSection.key] = oSection.title;
    });
  },
  fError: (oReq) => {
    console.log(oReq);
  }
};

var oPlex = {
  fConnection: () => {
    var hPlexLogin = document.getElementById("plexLogin");
    var hPlexPassword = document.getElementById("plexPassword");
    var oPayload = {
      "user" : {
        "login": hPlexLogin.value,
        "password": hPlexPassword.value
      }
    };
    if (oPayload.user.login && oPayload.user.password) {
      $http(oPlexUrl.sAuth, oPlexHeaders)
        .post(oPayload)
        .then(oXHRCallback.fLogin)
        .then(oXHRCallback.fPms)
        .catch(oXHRCallback.fError);
    } else {
      hPlexLogin.style.borderColor = oPayload.user.login ? null : "red";
      hPlexPassword.style.borderColor = oPayload.user.password ? null : "red";
    }
  },
  fConnectionEnter: (e) => {
    if (e.which == 13 || e.keyCode == 13)
      oPlex.fConnection();
  },
  fDisconnect: () => {
    document.getElementById("searchInput").onkeydown = null;
    oDraw.fDisconnect();
    aServer.length = 0;
    document.getElementById("connectDiv").hidden = false;
    document.getElementById("connectedDiv").hidden = true;
  },
  fPmsSections: () => {
    aServer.forEach((oServer) => {
      oServer.http.sections.get(null)
        .then(oXHRCallback.fSections)
        .catch(oXHRCallback.fError);
    });
  },
  fSearch: (e) => {
    if (e.which == 13 || e.keyCode == 13) {
      var oPayload = {
        query: document.querySelector("#searchInput").value,
        type: document.querySelector("#searchTypeSelector").value
      };
      if (oPayload.type === "0") { delete oPayload.type; }
      if (oPayload.query.length === 0) { return ; }
      oDraw.fSearchInit();
      aServer.forEach((oServer) => {
        oServer.http.search.get(oPayload)
          .then(oXHRCallback.fSearch)
          .catch(oXHRCallback.fError);
        if (!oPayload.type) {
          oPayload.type = 10;
          oServer.http.search.get(oPayload)
            .then(oXHRCallback.fSearch)
            .catch(oXHRCallback.fError);
        }
      })
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  oDraw = fDraw(oStrings.en);
  new Promise((resolve, reject) => {
    oDraw.fInit();
    resolve();
  }).then(() => {
    document.getElementById("plexSendLogin").onclick = oPlex.fConnection;
    document.getElementById("plexLogin").onkeydown = oPlex.fConnectionEnter;
    document.getElementById("plexPassword").onkeydown = oPlex.fConnectionEnter;
    document.getElementById("plexDisconnect").onclick = oPlex.fDisconnect;
  }).catch(() => {
  });
}, false);
