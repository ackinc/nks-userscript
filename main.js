// ==UserScript==
// @name         Keyboard navigation for Wolfram's "New Kind of Science"
// @namespace    http://tampermonkey.net/
// @version      2024-08-28
// @description  try to take over the world!
// @author       You
// @match        https://www.wolframscience.com/nks/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wolframscience.com
// @grant        none
// ==/UserScript==

let arrowNavListenersAdded = false;

(function () {
  "use strict";

  // if page opened to table of contents, the nav elems are not present
  if (navElemsArePresent()) {
    addKeyboardNav();
    prefetchAdjacentPages();
  }

  window.navigation.addEventListener("navigate", (e) => {
    if (!navElemsArePresent()) return;
    if (!arrowNavListenersAdded) addKeyboardNav();

    (async () => {
      await pageImageHasLoaded();
      prefetchAdjacentPages();
    })();
  });
})();

function navElemsArePresent() {
  return document.querySelector("#previous,#next");
}

function addKeyboardNav() {
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") document.querySelector("#previous > a")?.click();
    else if (e.key === "ArrowRight")
      document.querySelector("#next > a")?.click();
  });
  arrowNavListenersAdded = true;
}

function pageImageHasLoaded() {
  return new Promise((resolve) => {
    const pageImageNode = document.querySelector(
      "div#content > div.xlarge img"
    );
    pageImageNode.onload = resolve;
  });
}

async function prefetchAdjacentPages() {
  document
    .querySelectorAll("link.__prefetch_page_image__")
    .forEach((node) => document.body.removeChild(node));
  const linksToPrefetch = Array.from(
    document.querySelectorAll("#previous > a,#next > a")
  )
    .flatMap((a) => (a?.href ? getLinksToPrefetch(a.href) : null))
    .filter((x) => x);
  const prefetchNodes = linksToPrefetch.map(createPrefetchNode);
  prefetchNodes.forEach((node) => document.body.appendChild(node));
}

function createPrefetchNode(href) {
  const linkNode = document.createElement("link");
  linkNode.rel = "prefetch";
  linkNode.fetchpriority = "high";
  linkNode.classList.add("__prefetch_page_image__");
  linkNode.href = href;
  return linkNode;
}

function getLinksToPrefetch(pageHref) {
  const url = new URL(pageHref);
  const pathname = url.pathname;
  const pathnameParts = pathname.split("/");
  pathnameParts.splice(pathnameParts.indexOf("nks") + 1, 0, "pages");
  url.pathname = pathnameParts.join("/");
  return [url + "page.json", url + "image-xlarge.png"];
}
