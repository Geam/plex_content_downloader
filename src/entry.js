"use strict";

require("./css/main.css");

const oStrings = require("./lang.js");
const http = require("./http.js");
const fDraw = require("./draw.js");

const oPlexUrl = {
  sAuth: "https://plex.tv/users/sign_in.json",
  sPms: "https://plex.tv/api/resources?includeHttps=1",
  sSections: "/library/sections/",
  sSearch: "/search"
};

const oPlexHeaders = {
  "Accept": "application/json",
  "X-Plex-Product": "Plex Downloader",
  "X-Plex-Version": "1",
  "X-Plex-Client-Identifier": "28d88c58"
};
var aServer = [];
var oDraw = {};

var oXHRCallback = {
  fLogin: (oReq) => {
    var sAuthToken = JSON.parse(oReq.response).user.authentication_token;
    var oPlexPmsHeaders = Object.assign({}, oPlexHeaders);
    oPlexPmsHeaders["X-Plex-Token"] = sAuthToken;
    sessionStorage.setItem("accessToken", sAuthToken);
    return http.fRequest(oPlexUrl.sPms, oPlexPmsHeaders).get();
  },
  fPms: (oReq) => {
    var pmsRes = (new window.DOMParser()).parseFromString(oReq.response, "text/xml");
    aServer = Array.from(pmsRes.documentElement.children).reduce((aPrev, oCur) => {
      if (oCur.attributes.provides.value !== "server") { return aPrev; }
      var oServer = {
        accessToken: oCur.attributes.accessToken.value,
        name: oCur.attributes.name.value,
        uri: Array.from(oCur.children).reduce((sPrev, oCur) => {
          if (oCur.attributes.local.value == "1") { return sPrev; }
          return oCur.attributes.uri.value;
        }, ""),
        http: {}
      };
      if (! oServer.uri) { return aPrev; }
      var oHeader = Object.assign({}, oPlexHeaders);
      oHeader["X-Plex-Token"] = oServer.accessToken;
      oServer.http.search = http.fRequest(oServer.uri + oPlexUrl.sSearch, oHeader);
      oServer.http.sections = http.fRequest(oServer.uri + oPlexUrl.sSections, oHeader);
      return aPrev.concat(oServer);
    }, []);
    if (aServer.length > 0) {
      document.getElementById("connectDiv").hidden = true;
      oDraw.fControllBar(aServer);
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
        return http.fEncodeArgs("GET", { "X-Plex-Token": oServer.accessToken });
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
      http.fRequest(oPlexUrl.sAuth, oPlexHeaders)
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
    sessionStorage.removeItem("accessToken");
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
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  oDraw = fDraw(oStrings.en);
  oDraw.fInit();
  document.getElementById("plexSendLogin").onclick = oPlex.fConnection;
  document.getElementById("plexLogin").onkeydown = oPlex.fConnectionEnter;
  document.getElementById("plexPassword").onkeydown = oPlex.fConnectionEnter;
  document.getElementById("plexDisconnect").onclick = oPlex.fDisconnect;
  let accessToken = sessionStorage.getItem("accessToken");
  if (accessToken) {
    let tmpHeader = Object.assign({}, oPlexHeaders);
    tmpHeader["X-Plex-Token"] = accessToken;
    http.fRequest(oPlexUrl.sPms, tmpHeader).get()
      .then(oXHRCallback.fPms)
      .catch(oXHRCallback.fError);
  }
}, false);
