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
      const drawElement = (oElement) => {
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
            return fNewEl("div", {}, [
              fNewEl("img", { src: oRes.uri + oArtist.thumb + oRes.accessToken, alt: oArtist.title }),
              fNewEl("div", {}, [
                fNewEl("a", { type:"artist", uri:oArtist.key, class: "sType" }, oArtist.title)
              ])
            ]);
          },
          album: (oAlbum) => {
            return fNewEl("div", {}, [
              fNewEl("img", { src: oRes.uri + oAlbum.thumb + oRes.accessToken, alt: oAlbum.title }),
              fNewEl("div", {}, [
                fNewEl("a", { type:"artist", uri:oAlbum.parentKey, class: "sTypeParent" }, oAlbum.parentTitle),
                fNewEl("br", {}),
                fNewEl("a", { type:"album", uri:oAlbum.key, class: "sType" }, oAlbum.title)
              ])
            ]);
          },
          track: (oTrack) => {
            return fNewEl("div", {}, [
              fNewEl("img", { src: oRes.uri + oTrack.thumb + oRes.accessToken, alt: oTrack.parentTile }),
              fNewEl("div", {}, [
                fNewEl("a", { type:"artist", uri:oTrack.grandparentKey, class: "sTypeGrandParent" }, oTrack.grandparentTitle),
                fNewEl("br", {}),
                fNewEl("a", { type:"album", uri:oTrack.parentKey, class: "sTypeParent" }, oTrack.parentTitle),
                fNewEl("br", {}),
                fNewEl("a", { type:"track", uri:oTrack.key, class: "sType" }, oTrack.title)
              ])
            ]);
          }
        };
        fAddContent(parentDiv, fDrawType[oElement.type](oElement));
      };
      oRes._children.forEach(drawElement);
    }
  };
};
