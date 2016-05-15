module.exports = (oStrings) => {
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
    fControllBar: (aServer) => {
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
