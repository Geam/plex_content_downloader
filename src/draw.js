module.exports = (oStrings) => {
  const fAddAttribute = (el, attr) => {
    if (typeof el === "string")
      el = document.querySelector(el);
    if (!(el instanceof Element)) { return; }
    Object.keys(attr).forEach((key) => {
      el.attributes[key] = attr[key];
    });
  };
  const fAddContent = (el, content) => {
    if (typeof el === "string")
      el = document.querySelector(el);
    if (!(el instanceof Element)) { return; }
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
      fAddAttribute("#plexLogin", {placeholder: oStrings.topBar.login});
      fAddAttribute("#plexPassword", {placeholder: oStrings.topBar.password});
      fDelEl("#plexSendLogin");
      fAddContent("#plexSendLogin", oStrings.topBar.connect);
      fDelEl("#plexDisconnect");
      fAddContent("#plexDisconnect", oStrings.topBar.disconnect);
    },
    fControllBar: (aServer) => {
      fDelEl("#serverSelector");
      fAddContent("#serverSelector", aServer.reduce((aPrev, oCur, iIdx) => {
        return aPrev.concat(fNewEl("option", { value: iIdx }, oCur.name));
      }, []));
      fDelEl("#searchTypeSelector");
      fAddContent("#searchTypeSelector",
        Object.keys(oStrings.content.mediaType).reduce((aPrev, sCur, iIdx) => {
          return aPrev.concat(fNewEl("option", { value: iIdx + 1 },
                                     oStrings.content.mediaType[sCur]));
            }, [fNewEl("option", { value: 0 }, oStrings.topBar.all)]));
      document.getElementById("controlDiv").style.display = "";
    },
    fDisconnect: () => {
      document.getElementById("controlDiv").style.display = "none";
      fDelEl("#content");
    },
    fSearchInit: () => {
      fDelEl("#content");
    },
    fSearch: (oRes) => {
      const fDrawElement = (oElement) => {
        if (!oElement.librarySectionID) { return ; }
        var parentDiv = document.getElementById("res-" + oElement.type + "-content");
        if (!(parentDiv instanceof Element)) {
          fAddContent("#content",
            fNewEl("div", { id: "res-" + oElement.type }, [
              fNewEl("div", { class: "sectionTitle" },
                     oStrings.content.mediaType[oElement.type]),
              fNewEl("div", { id: "res-" + oElement.type + "-content",
                     class: "sectionContainer"}, null)
            ])
          );
          parentDiv = document.getElementById("res-" + oElement.type + "-content");
        }
        if (oElement.type === "season") { oElement.title = oStrings.content.mediaType.season + " " + oElement.index; }
        else if (oElement.type === "episode") { oElement.parentTitle = oStrings.content.mediaType.season + " " + oElement.parentIndex; }
        const aAccess = [
          { key: "grandparentKey", title: "grandparentTitle", class: "sTypeGrandParent" },
          { key: "parentKey", title: "parentTitle", class: "sTypeParent" },
          { key: "key", title: "title", class: "sType" }
        ];
        const fDrawType = (oData) => {
          let iOffset = 3 - oData.children.length;
          return fNewEl("div", { class: oData.mainClass }, [
            fNewEl("img", { src: oRes.uri + oData.thumb + oRes.accessToken, alt: oElement.title }),
            fNewEl("div", {}, [].concat(oData.children.reduce((aPrev, eCur, iIdx) => {
              if (iIdx === 0) {
                return aPrev.concat(fNewEl("a", { type: eCur, uri: oElement[aAccess[iOffset].key], class: aAccess[iOffset].class }, oElement[aAccess[iOffset].title]));
              }
              return aPrev.concat([
                fNewEl("br", {}),
                fNewEl("a", { type: eCur, uri: oElement[aAccess[iOffset + iIdx].key], class: aAccess[iOffset + iIdx].class }, oElement[aAccess[iOffset + iIdx].title])
              ]);
            }, []),[
              fNewEl("br", {}),
              fNewEl("span", { class: "serverName" }, oRes.serverName)
            ]))
          ]);
        };
        var oDrawType = {
          movie: {
            mainClass: "rectangle",
            thumb: oElement.thumb ? oElement.thumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "movie" ]
          },
          show: {
            mainClass: "rectangle",
            thumb: oElement.thumb ? oElement.thumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "show" ]
          },
          season: {
            mainClass: "rectangle",
            thumb: oElement.thumb ? oElement.parentThumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "show", "season" ]
          },
          episode: {
            mainClass: "rectangle",
            thumb: oElement.thumb ? oElement.grandparentThumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "show", "season", "episode" ]
          },
          artist: {
            mainClass: "square",
            thumb: oElement.thumb ? oElement.thumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "artist" ]
          },
          album: {
            mainClass: "square",
            thumb: oElement.thumb ? oElement.thumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "artist", "album" ]
          },
          track: {
            mainClass: "square",
            thumb: oElement.thumb ? oElement.thumb : "/:/resources/DefaultAlbumCover.png",
            children: [ "artist", "album", "track" ]
          }
        };
        fAddContent(parentDiv, fDrawType(oDrawType[oElement.type]));
      };
      oRes._children.forEach(fDrawElement);
    }
  };
};
