"use strict";
const { webFrame } = require("electron");
const { is } = require("./util");
const {store: settings} = require("./settings");

class Nav {
  constructor() {
    this._defaultZoomFactor = 1.0;
    this._listItem = ".listItem-container";
    this._lists = ".lists";
    this._lowerZoomLimit = 0.7;
    this._myDayList = ".todayToolbar-item";
    this._selectedListClass = "active";
    this._upperZoomLimit = 1.3;
    this._zoomStep = 0.05;
  }

  get _lastIdx() {
    return this._getLists().length - 1;
  }

  _clickClass(x) {
    document.querySelector(`.${x}`).click();
  }

  _clickId(x) {
    document.getElementById(x).click();
  }

  _currentIdx(lists) {
    if (lists == null) lists = this._getLists();

    for (let i = 0; i < lists.length; i++) {
      if (lists[i].classList.contains(this._selectedListClass)) {
        return i;
      }
    }

    return 0;
  }

  _getLists() {
    const myDayList = this.select(this._myDayList);
    return [
      myDayList,
      ...document.querySelector(this._lists).querySelectorAll(this._listItem)
    ];
  }

  click(x) {
    console.log("🚀 ~ file: nav.js ~ line 48 ~ Nav ~ click ~ x", x);
    document.querySelector(x).click();
  }

  jumpToList(event) {
    const comboKey = is.darwin ? event.metaKey : event.ctrlKey;

    if (!comboKey) {
      return null;
    }

    const n = parseInt(event.key, 10);

    if (n > 0 && n < 10) {
      this.selectList(n - 1);
    }
  }

  sideBar() {
    document.documentElement.classList.toggle(
      "side-bar-hidden",
      settings.get("sideBarHidden")
    );
  }

  nextList() {
    const lists = this._getLists();
    const idx = this._currentIdx(lists);
    this.selectList(idx === this._lastIdx ? 0 : idx + 1, lists);
  }

  previousList() {
    const lists = this._getLists();
    const idx = this._currentIdx(lists);
    return this.selectList(idx === 0 ? this._lastIdx : idx - 1, lists);
  }

  select(x) {
    return document.querySelector(x);
  }

  selectList(idx, lists) {
    if (idx >= 0 && idx <= this._lastIdx) {
      if (lists == null) lists = this._getLists();
      const { id, className } = lists[idx].children[0];
      return id ? this._clickId(id) : this._clickClass(className);
    }
  }

  zoomIn() {
    const zoomFactor = webFrame.getZoomFactor() + this._zoomStep;

    if (zoomFactor < this._upperZoomLimit) {
      webFrame.setZoomFactor(zoomFactor);
      settings.setget("zoomFactor", zoomFactor);
    }
  }

  zoomReset() {
    webFrame.setZoomFactor(this._defaultZoomFactor);
    settings.setget("zoomFactor", this._defaultZoomFactor);
  }

  zoomRestore() {
    webFrame.setZoomFactor(settings.get("zoomFactor"));
  }

  zoomOut() {
    const zoomFactor = webFrame.getZoomFactor() - this._zoomStep;

    if (zoomFactor > this._lowerZoomLimit) {
      webFrame.setZoomFactor(zoomFactor);
      settings.setget("zoomFactor", zoomFactor);
    }
  }
}

module.exports = new Nav();
